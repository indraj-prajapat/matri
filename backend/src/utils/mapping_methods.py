import sys, os 
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import openai
import json
from typing import List, Dict
from src.utils.helper import *

groq = GroqHelper(env_groq_client()) if groq is not None else None
emb = EmbeddingModel("all-MiniLM-L6-v2")

import numpy as np
from difflib import SequenceMatcher
from typing import Dict

def llm_descriptions_similarity(
    src_key: str, tgt_key: str, descriptions: Dict[str, str], emb_model
) -> float:
    """
    Compute similarity between LLM-generated descriptions for two keys.
    Uses both embeddings (semantic meaning) and string similarity
    to ensure high scores when context matches.
    """

    # Get descriptions (fallback to key if not found)
    src_desc = descriptions.get(src_key, src_key)
    tgt_desc = descriptions.get(tgt_key, tgt_key)

    # Enrich context by including key + description
    src_text = f"{src_key}: {src_desc}".lower().strip()
    tgt_text = f"{tgt_key}: {tgt_desc}".lower().strip()

    # ---- Embedding similarity ----
    vecs = emb_model.embed([src_text, tgt_text])
    v1, v2 = vecs[0], vecs[1]
    emb_score = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

    # ---- String similarity on text ----
    text_score = SequenceMatcher(None, src_text, tgt_text).ratio()

    # ---- Hybrid score ----
    # Weighted average: embeddings carry more weight, but string similarity boosts
    final_score = 0.7 * emb_score + 0.3 * text_score

    return final_score


def compute_score(src_key, tgt_key, emb, groq):
    fuzzy, semantic, synonym = refined_token_disintegration_score(src_key, tgt_key, emb, groq)
    return tgt_key, fuzzy, semantic, synonym


def refined_token_disintegration_score(
    src_key: str,
    tgt_key: str,
    emb_model: EmbeddingModel,
    groq_helper: GroqHelper
) -> Tuple[float, float, float]:
    s_tokens = tokenize_key(src_key)
    t_tokens = tokenize_key(tgt_key)
    if not s_tokens or not t_tokens:
        return 0.0, 0.0, 0.0

    # --- your existing fuzzy + semantic parts (unchanged) ---
    all_tokens = list(set(s_tokens + t_tokens))
    token_embs = {tok: vec for tok, vec in zip(all_tokens, emb_model.embed(all_tokens))}

    def _score_one_way(tokens_a, tokens_b):
        match_count_fuzzy, match_count_semantic = 0.0, 0.0
        for tok_a in tokens_a:
            best_fuzzy, best_semantic = 0.0, 0.0
            for tok_b in tokens_b:
                fuzzy_score = levenshtein_similarity(tok_a, tok_b)
                semantic_score = semantic_cosine_score(token_embs.get(tok_a), token_embs.get(tok_b))
                best_fuzzy = max(best_fuzzy, fuzzy_score)
                best_semantic = max(best_semantic, semantic_score)
            match_count_fuzzy += best_fuzzy
            match_count_semantic += best_semantic
        return (match_count_fuzzy / len(tokens_a), match_count_semantic / len(tokens_a))

    fuzzy_src_to_tgt, semantic_src_to_tgt = _score_one_way(s_tokens, t_tokens)
    fuzzy_tgt_to_src, semantic_tgt_to_src = _score_one_way(t_tokens, s_tokens)

    def harmonic_mean(a, b):  # smoothed to avoid hard collapse
        return (2 * a * b) / (a + b + 1e-6)

    fuzzy_score = harmonic_mean(fuzzy_src_to_tgt, fuzzy_tgt_to_src)
    semantic_score = harmonic_mean(semantic_src_to_tgt, semantic_tgt_to_src)

    # --- improved synonym / alias coverage with canonicalization & weights ---
    s_norm = [normalize(t) for t in s_tokens]
    t_norm = [normalize(t) for t in t_tokens]

    s_set = set(s_norm)
    t_set = set(t_norm)

    # Optional: only expand synonyms for source tokens that look like abbreviations/short
    # (keeps noise down). You can keep using groq_helper, but only for these tokens:
    ABBREV_LIKE = {tok for tok in s_set if len(tok) <= 3 or tok in {"dob", "id", "no", "num"}}
    syn_expansion = groq_helper.get_all_synonyms(list(ABBREV_LIKE)) if ABBREV_LIKE else {}

    def matches_as_syn(tok_a: str, tok_b: str) -> bool:
        if tok_a == tok_b:
            return True
        # cross-check synonym expansions for source
        if tok_b in syn_expansion.get(tok_a, set()):
            return True
        # small fuzzy backup for alias-y abbreviations (e.g., num ~ number)
        if max(len(tok_a), len(tok_b)) <= 7 and levenshtein_similarity(tok_a, tok_b) >= 0.85:
            return True
        return False

    matched_weight = 0.0
    total_weight = sum(token_weight(t) for t in s_set)

    for a in s_set:
        # find any b in target set that matches a (canonical equality / synonyms / fuzzy alias)
        if any(matches_as_syn(a, b) for b in t_set):
            matched_weight += token_weight(a)

    synonym_score = (matched_weight / (total_weight + 1e-6)) if total_weight > 0 else 0.0

    return fuzzy_score, semantic_score, synonym_score