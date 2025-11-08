"""
Create a filtered CSV with only necessary fields and exclude 'remaining' bucket
"""

import csv
import os
from pathlib import Path

# Input and output paths
INPUT_CSV = "filtered_csedu.csv"
OUTPUT_CSV = "webapp_reference.csv"

def create_filtered_csv():
    """Create a filtered CSV for webapp use"""
    
    print(f"Reading from: {INPUT_CSV}")
    
    filtered_rows = []
    total_count = 0
    excluded_count = 0
    
    with open(INPUT_CSV, 'r', encoding='utf-8', errors='ignore') as infile:
        reader = csv.DictReader(infile)
        
        for row in reader:
            total_count += 1
            
            # Skip if in 'remaining' bucket or assigned_split is 'remaining'
            bucket = (row.get('bucket') or '').lower()
            assigned_split = (row.get('assigned_split') or '').lower()
            
            if 'remaining' in bucket or 'remaining' in assigned_split:
                excluded_count += 1
                continue
            
            # Extract only necessary fields
            filtered_row = {
                'filename': Path(row.get('path', '')).stem,  # Filename without extension
                'sentence': row.get('sentence', ''),
                'age': row.get('age', ''),
                'gender': row.get('gender', ''),
                'accents': row.get('accents', ''),
                'variant': row.get('variant', ''),
                'demog_group': row.get('demog_group', ''),
                'bucket': row.get('bucket', ''),
                'duration_s': row.get('duration_s', '')
            }
            
            filtered_rows.append(filtered_row)
    
    # Write filtered CSV
    with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as outfile:
        fieldnames = ['filename', 'sentence', 'age', 'gender', 'accents', 'variant', 'demog_group', 'bucket', 'duration_s']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        
        writer.writeheader()
        writer.writerows(filtered_rows)
    
    print(f"\nResults:")
    print(f"  Total rows processed: {total_count}")
    print(f"  Excluded (remaining): {excluded_count}")
    print(f"  Included in output: {len(filtered_rows)}")
    print(f"\nOutput written to: {OUTPUT_CSV}")
    print(f"File size reduction: {os.path.getsize(INPUT_CSV) / 1024:.1f} KB -> {os.path.getsize(OUTPUT_CSV) / 1024:.1f} KB")

if __name__ == "__main__":
    create_filtered_csv()
