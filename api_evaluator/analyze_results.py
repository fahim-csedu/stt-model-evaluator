"""
Analyze the transcription results CSV for benchmarking
"""

import pandas as pd
import os
from pathlib import Path

try:
    from config import CSV_OUTPUT_PATH
except ImportError:
    CSV_OUTPUT_PATH = r"D:\cv_eval_bn\transcription_path.csv"


def analyze_results():
    """Analyze the transcription results"""
    
    if not os.path.exists(CSV_OUTPUT_PATH):
        print(f"ERROR: CSV file not found: {CSV_OUTPUT_PATH}")
        print("Run batch_transcribe_v2.py first to generate results.")
        return
    
    print("=" * 80)
    print("TRANSCRIPTION RESULTS ANALYSIS")
    print("=" * 80)
    print(f"CSV file: {CSV_OUTPUT_PATH}\n")
    
    # Load CSV
    df = pd.read_csv(CSV_OUTPUT_PATH)
    
    # Basic statistics
    total_files = len(df)
    successful = (df['transcription_file_path'] != 'ERROR').sum()
    failed = total_files - successful
    
    print(f"Total files processed: {total_files}")
    print(f"Successful: {successful} ({successful/total_files*100:.1f}%)")
    print(f"Failed: {failed} ({failed/total_files*100:.1f}%)")
    print()
    
    if successful == 0:
        print("No successful transcriptions to analyze.")
        return
    
    # Filter successful transcriptions
    df_success = df[df['transcription_file_path'] != 'ERROR'].copy()
    
    # Convert to numeric (handle 'N/A' values)
    df_success['audio_length_seconds'] = pd.to_numeric(df_success['audio_length_seconds'], errors='coerce')
    df_success['api_response_time_seconds'] = pd.to_numeric(df_success['api_response_time_seconds'], errors='coerce')
    
    # Calculate RTF (Real-Time Factor)
    df_success['rtf'] = df_success['api_response_time_seconds'] / df_success['audio_length_seconds']
    
    # Audio duration statistics
    print("AUDIO DURATION STATISTICS")
    print("-" * 80)
    total_audio_hours = df_success['audio_length_seconds'].sum() / 3600
    avg_audio_length = df_success['audio_length_seconds'].mean()
    median_audio_length = df_success['audio_length_seconds'].median()
    min_audio_length = df_success['audio_length_seconds'].min()
    max_audio_length = df_success['audio_length_seconds'].max()
    
    print(f"Total audio duration: {total_audio_hours:.2f} hours")
    print(f"Average audio length: {avg_audio_length:.2f} seconds")
    print(f"Median audio length: {median_audio_length:.2f} seconds")
    print(f"Min audio length: {min_audio_length:.2f} seconds")
    print(f"Max audio length: {max_audio_length:.2f} seconds")
    print()
    
    # Processing time statistics
    print("API PROCESSING TIME STATISTICS")
    print("-" * 80)
    total_processing_hours = df_success['api_response_time_seconds'].sum() / 3600
    avg_processing_time = df_success['api_response_time_seconds'].mean()
    median_processing_time = df_success['api_response_time_seconds'].median()
    min_processing_time = df_success['api_response_time_seconds'].min()
    max_processing_time = df_success['api_response_time_seconds'].max()
    
    print(f"Total processing time: {total_processing_hours:.2f} hours")
    print(f"Average processing time: {avg_processing_time:.2f} seconds")
    print(f"Median processing time: {median_processing_time:.2f} seconds")
    print(f"Min processing time: {min_processing_time:.2f} seconds")
    print(f"Max processing time: {max_processing_time:.2f} seconds")
    print()
    
    # Real-Time Factor (RTF) statistics
    print("REAL-TIME FACTOR (RTF) ANALYSIS")
    print("-" * 80)
    avg_rtf = df_success['rtf'].mean()
    median_rtf = df_success['rtf'].median()
    min_rtf = df_success['rtf'].min()
    max_rtf = df_success['rtf'].max()
    
    print(f"Average RTF: {avg_rtf:.3f}x")
    print(f"Median RTF: {median_rtf:.3f}x")
    print(f"Min RTF: {min_rtf:.3f}x")
    print(f"Max RTF: {max_rtf:.3f}x")
    print()
    
    if avg_rtf < 1.0:
        print(f"✓ API is {1/avg_rtf:.2f}x FASTER than real-time on average")
    elif avg_rtf == 1.0:
        print("→ API processes at exactly real-time speed")
    else:
        print(f"✗ API is {avg_rtf:.2f}x SLOWER than real-time on average")
    print()
    
    # Transcript statistics
    print("TRANSCRIPT STATISTICS")
    print("-" * 80)
    df_success['transcript_length'] = df_success['transcript'].str.len()
    avg_transcript_length = df_success['transcript_length'].mean()
    median_transcript_length = df_success['transcript_length'].median()
    
    print(f"Average transcript length: {avg_transcript_length:.0f} characters")
    print(f"Median transcript length: {median_transcript_length:.0f} characters")
    print()
    
    # Throughput
    print("THROUGHPUT ANALYSIS")
    print("-" * 80)
    files_per_hour = successful / total_processing_hours if total_processing_hours > 0 else 0
    audio_hours_per_hour = total_audio_hours / total_processing_hours if total_processing_hours > 0 else 0
    
    print(f"Files processed per hour: {files_per_hour:.1f}")
    print(f"Audio hours processed per hour: {audio_hours_per_hour:.2f}x")
    print()
    
    # Distribution by audio length
    print("DISTRIBUTION BY AUDIO LENGTH")
    print("-" * 80)
    bins = [0, 10, 20, 30, 60, 120, float('inf')]
    labels = ['0-10s', '10-20s', '20-30s', '30-60s', '60-120s', '>120s']
    df_success['length_bin'] = pd.cut(df_success['audio_length_seconds'], bins=bins, labels=labels)
    
    distribution = df_success['length_bin'].value_counts().sort_index()
    for length_range, count in distribution.items():
        percentage = count / len(df_success) * 100
        print(f"{length_range:>10}: {count:4d} files ({percentage:5.1f}%)")
    print()
    
    # Show sample transcripts
    print("SAMPLE TRANSCRIPTS (first 5)")
    print("-" * 80)
    for idx, row in df_success.head(5).iterrows():
        filename = Path(row['audio_file_path']).name
        transcript = row['transcript'][:100] + '...' if len(row['transcript']) > 100 else row['transcript']
        print(f"{filename}: {transcript}")
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    try:
        analyze_results()
    except Exception as e:
        print(f"\nError analyzing results: {e}")
        import traceback
        traceback.print_exc()
