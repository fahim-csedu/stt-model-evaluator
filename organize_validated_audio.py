#!/usr/bin/env python3
"""
Script to organize audio files into validated folders based on error statistics.
Creates 4 folders with 100 WAV files each:
- commonvoice_wer_error
- commonvoice_cer_error
- bntts_cer_error
- bntts_wer_error
"""

import os
import csv
import shutil
import subprocess
from pathlib import Path

# Source directories
BNTTS_SOURCE = r"D:\Final_data_MRK\Modified"
COMMONVOICE_SOURCE = r"D:\cv_eval_bn\validated"

# Destination base directory
DEST_BASE = "webapp/validated"

# CSV files
BNTTS_CSV = "STT Stats - bntts highest error.csv"
COMMONVOICE_CSV = "STT Stats - common voice highest error.csv"

def create_folders():
    """Create the required folder structure."""
    folders = [
        "commonvoice_wer_error",
        "commonvoice_cer_error",
        "bntts_cer_error",
        "bntts_wer_error"
    ]
    
    for folder in folders:
        folder_path = os.path.join(DEST_BASE, folder)
        os.makedirs(folder_path, exist_ok=True)
        print(f"Created/verified folder: {folder_path}")
    
    return folders

def read_csv_filenames(csv_path, column_index):
    """
    Read filenames from CSV file by column index.
    column_index: 0 for column A, 4 for column E
    Skips the first row (header).
    """
    filenames = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header row
        
        for row in reader:
            if len(row) > column_index:
                filename = row[column_index].strip()
                if filename:
                    filenames.append(filename)
    
    return filenames

def convert_to_wav(input_path, output_path):
    """Convert audio file to WAV format using ffmpeg."""
    try:
        # Use ffmpeg to convert to WAV
        cmd = [
            'ffmpeg',
            '-i', input_path,
            '-acodec', 'pcm_s16le',  # 16-bit PCM
            '-ar', '16000',  # 16kHz sample rate
            '-ac', '1',  # mono
            '-y',  # overwrite output file
            output_path
        ]
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error converting {input_path}: ffmpeg failed")
        return False
    except FileNotFoundError:
        print("Error: ffmpeg not found. Please install ffmpeg and add it to PATH")
        return False
    except Exception as e:
        print(f"Error converting {input_path}: {e}")
        return False

def copy_bntts_files(filenames, dest_folder, limit=100):
    """Copy BNTTS WAV files to destination folder."""
    copied = 0
    
    for filename in filenames:
        if copied >= limit:
            break
        
        # BNTTS files are already WAV
        source_path = os.path.join(BNTTS_SOURCE, f"{filename}.wav")
        
        if not os.path.exists(source_path):
            print(f"Warning: Source file not found: {source_path}")
            continue
        
        dest_path = os.path.join(dest_folder, f"{filename}.wav")
        
        try:
            shutil.copy2(source_path, dest_path)
            copied += 1
            print(f"Copied {copied}/{limit}: {filename}.wav")
        except Exception as e:
            print(f"Error copying {filename}: {e}")
    
    return copied

def find_file_in_nested_folders(base_path, filename):
    """Search for a file recursively in nested folders."""
    target_file = f"{filename}.wav"
    
    # Walk through all subdirectories
    for root, dirs, files in os.walk(base_path):
        if target_file in files:
            return os.path.join(root, target_file)
    
    return None

def copy_commonvoice_files(filenames, dest_folder, limit=100):
    """Copy Common Voice WAV files to destination folder."""
    copied = 0
    
    for filename in filenames:
        if copied >= limit:
            break
        
        # Search for the file in nested folders
        source_path = find_file_in_nested_folders(COMMONVOICE_SOURCE, filename)
        
        if source_path is None:
            print(f"Warning: Source file not found: {filename}.wav")
            continue
        
        dest_path = os.path.join(dest_folder, f"{filename}.wav")
        
        try:
            shutil.copy2(source_path, dest_path)
            copied += 1
            print(f"Copied {copied}/{limit}: {filename}.wav")
        except Exception as e:
            print(f"Error copying {filename}: {e}")
    
    return copied

def main():
    print("=" * 60)
    print("Audio File Organization Script")
    print("=" * 60)
    
    # Create folder structure
    print("\n1. Creating folder structure...")
    create_folders()
    
    # Process BNTTS WER errors (Column A = index 0)
    print("\n2. Processing BNTTS WER errors (Column A)...")
    bntts_wer_files = read_csv_filenames(BNTTS_CSV, column_index=0)
    print(f"Found {len(bntts_wer_files)} BNTTS WER filenames")
    dest_folder = os.path.join(DEST_BASE, "bntts_wer_error")
    copied = copy_bntts_files(bntts_wer_files, dest_folder, limit=100)
    print(f"Copied {copied} files to bntts_wer_error")
    
    # Process BNTTS CER errors (Column E = index 4)
    print("\n3. Processing BNTTS CER errors (Column E)...")
    bntts_cer_files = read_csv_filenames(BNTTS_CSV, column_index=4)
    print(f"Found {len(bntts_cer_files)} BNTTS CER filenames")
    dest_folder = os.path.join(DEST_BASE, "bntts_cer_error")
    copied = copy_bntts_files(bntts_cer_files, dest_folder, limit=100)
    print(f"Copied {copied} files to bntts_cer_error")
    
    # Process Common Voice WER errors (Column A = index 0)
    print("\n4. Processing Common Voice WER errors (Column A)...")
    cv_wer_files = read_csv_filenames(COMMONVOICE_CSV, column_index=0)
    print(f"Found {len(cv_wer_files)} Common Voice WER filenames")
    dest_folder = os.path.join(DEST_BASE, "commonvoice_wer_error")
    copied = copy_commonvoice_files(cv_wer_files, dest_folder, limit=100)
    print(f"Copied {copied} files to commonvoice_wer_error")
    
    # Process Common Voice CER errors (Column E = index 4)
    print("\n5. Processing Common Voice CER errors (Column E)...")
    cv_cer_files = read_csv_filenames(COMMONVOICE_CSV, column_index=4)
    print(f"Found {len(cv_cer_files)} Common Voice CER filenames")
    dest_folder = os.path.join(DEST_BASE, "commonvoice_cer_error")
    copied = copy_commonvoice_files(cv_cer_files, dest_folder, limit=100)
    print(f"Copied {copied} files to commonvoice_cer_error")
    
    print("\n" + "=" * 60)
    print("Processing complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
