from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
import json
import random
from src.main import get_data_mapping

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
@app.route('/map_files', methods=['POST'])
def map_files():
    try:
        # Get all files (could be multiple)
        all_files = request.files.getlist("files")
        metadata_raw = request.form.get("metadata")
        print('all files \n',all_files)
        print('metadata \n',metadata_raw)
        if not all_files:
            return jsonify({"error": "No files uploaded"}), 400
        if not metadata_raw:
            return jsonify({"error": "No metadata provided"}), 400

        metadata = json.loads(metadata_raw)

        # Separate source and target files
        source_files = [f for f in all_files if f.filename in metadata and metadata[f.filename].get("type") == "source"]
        target_files = [f for f in all_files if f.filename in metadata and metadata[f.filename].get("type") == "target"]
        print('source file \n',source_files)
        print('target files \n',target_files)
        if not source_files or not target_files:
            return jsonify({"error": "Need at least one source and one target file"}), 400

        # Convert all source and target CSVs to JSON
        source_data = {}
        for src in source_files:
            source_data[src.filename] = csv_to_json(src)
            print('-------------src--------\n',src)
            print('--------------json-------\n',source_data[src.filename])
        target_data = {}
        for tgt in target_files:
            target_data[tgt.filename] = csv_to_json(tgt)
        print('source data \n', source_data)
        print('target data \n',target_data)
        # -------------------------------------------------------------
        # Build final result
        # -------------------------------------------------------------
        final_result = {}

        # Loop through each target
        for tgt_file, tgt_json in target_data.items():
            tgt_meta = metadata[tgt_file]
            print('tartget data fo function \n',tgt_json)
            tgt_msg_name = tgt_meta["message_name"]
            final_result[tgt_msg_name] = {}

            # For each target file, aggregate mappings from all sources
            aggregated_results = {}

            for src_file, src_json in source_data.items():
                src_meta = metadata[src_file]
                print('source data fo function \n',src_json)
                mapping_result = get_data_mapping(src_json, tgt_json)
                print('result mapping ',mapping_result)
                # Combine into aggregated structure
                for tgt_key, mappings in mapping_result.items():
                    if tgt_key not in aggregated_results:
                        aggregated_results[tgt_key] = []
                    for m in mappings:
                        m.update({
                            "source_message": src_meta["message_name"],
                            "source_file": src_file,
                            "source_country": src_meta["country"],
                            "source_domain": src_meta["domain"],
                            "source_system": src_meta["system"]
                        })
                        aggregated_results[tgt_key].append(m)

            # -------------------------------------------------------------
            # Select top 3 per target key (based on final_score)
            # -------------------------------------------------------------
            for tgt_key, mappings in aggregated_results.items():
                sorted_mappings = sorted(mappings, key=lambda x: x["final_score"], reverse=True)[:3]
                entry = {}
                for idx, m in enumerate(sorted_mappings, start=1):
                    entry[f"key{idx}"] = {
                        "final_score": m["final_score"],
                        "source_message": m["source_message"],
                        'source_key':m['source_key'],
                        "source_file": m["source_file"],
                        "source_country": m["source_country"],
                        "source_domain": m["source_domain"],
                        "source_system": m["source_system"]
                    }
                final_result[tgt_msg_name][tgt_key] = entry
        print('final result \n',final_result    )
        return jsonify(final_result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=False)
