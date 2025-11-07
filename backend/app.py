from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
import json
import random
from src.main import get_data_mapping
from concurrent.futures import ProcessPoolExecutor
from itertools import product
import multiprocessing
app = Flask(__name__)
CORS(app)

# -------------------------------------------------------------
# Utility: Convert CSV to JSON
# -------------------------------------------------------------
def csv_to_json(file):
    """Convert a CSV file into dict: {col1_row1: col2_row1, ...}"""
    df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
    df = df.dropna(how='all')

    if df.shape[1] < 2:
        raise ValueError(f"CSV file {file.filename} must have at least 2 columns")

    col1, col2 = df.columns[0], df.columns[1]
    result = {}
    for _, row in df.iterrows():
        key = f"{row[col1]}"
        result[key] = row[col2]
    return result


# -------------------------------------------------------------
# Dummy mapping logic (replace with your actual get_data_mapping)
# -------------------------------------------------------------



# -------------------------------------------------------------
# API endpoint
# -------------------------------------------------------------
from concurrent.futures import ThreadPoolExecutor, as_completed
from itertools import product

# Define this function at MODULE LEVEL (outside the route)
def process_source_target_pair(src_file, src_json, tgt_file, tgt_json, metadata):
    """Process a single source-target pair"""
    src_meta = metadata[src_file]
    mapping_result = get_data_mapping(src_json, tgt_json)
    
    # Enrich mappings with source metadata
    enriched_results = {}
    for tgt_key, mappings in mapping_result.items():
        enriched_mappings = []
        for m in mappings:
            m_copy = m.copy()
            m_copy.update({
                "source_message": src_meta["message_name"],
                "source_file": src_file,
                "source_country": src_meta["country"],
                "source_domain": src_meta["domain"],
                "source_system": src_meta["system"]
            })
            enriched_mappings.append(m_copy)
        enriched_results[tgt_key] = enriched_mappings
    
    return tgt_file, enriched_results
import time
@app.route('/map_files', methods=['POST'])
def map_files():
    try:
        start_total_t = time.time()
        # Get all files (could be multiple)
        all_files = request.files.getlist("files")
        metadata_raw = request.form.get("metadata")
      
        if not all_files:
            return jsonify({"error": "No files uploaded"}), 400
        if not metadata_raw:
            return jsonify({"error": "No metadata provided"}), 400

        metadata = json.loads(metadata_raw)

        # Separate source and target files
        source_files = [f for f in all_files if f.filename in metadata and metadata[f.filename].get("type") == "source"]
        target_files = [f for f in all_files if f.filename in metadata and metadata[f.filename].get("type") == "target"]
       
        if not source_files or not target_files:
            return jsonify({"error": "Need at least one source and one target file"}), 400

        # Convert all source and target CSVs to JSON
        source_data = {}
        for src in source_files:
            source_data[src.filename] = csv_to_json(src)
          
        target_data = {}
        for tgt in target_files:
            target_data[tgt.filename] = csv_to_json(tgt)
       
        # -------------------------------------------------------------
        # Build final result with parallel processing
        # -------------------------------------------------------------
        final_result = {}

        # Create all source-target pairs
        pairs = list(product(source_data.items(), target_data.items()))

        # Use ThreadPoolExecutor instead of ProcessPoolExecutor
        # It's simpler and works better with Flask
        max_workers = min(8, len(pairs))  # Use up to 8 threads

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for (src_file, src_json), (tgt_file, tgt_json) in pairs:
                future = executor.submit(
                    process_source_target_pair,
                    src_file, src_json, tgt_file, tgt_json, metadata
                )
                futures.append(future)
            
            # Aggregate results by target
            aggregated_by_target = {}
            for future in as_completed(futures):
                tgt_file, enriched_results = future.result()
                if tgt_file not in aggregated_by_target:
                    aggregated_by_target[tgt_file] = {}
                
                for tgt_key, mappings in enriched_results.items():
                    if tgt_key not in aggregated_by_target[tgt_file]:
                        aggregated_by_target[tgt_file][tgt_key] = []
                    aggregated_by_target[tgt_file][tgt_key].extend(mappings)
            
            # Final structuring
            for tgt_file in target_data.keys():
                tgt_meta = metadata[tgt_file]
                tgt_msg_name = tgt_meta["message_name"]
                final_result[tgt_msg_name] = {}
                
                for tgt_key, mappings in aggregated_by_target.get(tgt_file, {}).items():
                    sorted_mappings = sorted(mappings, key=lambda x: x["final_score"], reverse=True)
                    entry = {}
                    for idx, m in enumerate(sorted_mappings, start=1):
                        entry[f"key{idx}"] = {
                            "final_score": m["final_score"],
                            "source_message": m["source_message"],
                            "source_key": m["source_key"],
                            "source_file": m["source_file"],
                            "source_country": m["source_country"],
                            "source_domain": m["source_domain"],
                            "source_system": m["source_system"]
                        }
                    final_result[tgt_msg_name][tgt_key] = entry
        print(f"✅ total time in api: {time.time() - start_total_t:.2f} sec")
        return jsonify(final_result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(debug=False)
