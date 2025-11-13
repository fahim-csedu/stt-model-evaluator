import os 
import json
import csv

def dp_lcs(X, Y, i, j, memo):
    if i == len(X) or j == len(Y):
        memo[(i, j)] = 0
        return 0
    if (i, j) in memo:
        return memo[(i, j)]
    if X[i] == Y[j]:
        memo[(i, j)] = 1 + dp_lcs(X, Y, i + 1, j + 1, memo)
    else:
        memo[(i, j)] = max(dp_lcs(X, Y, i + 1, j, memo), dp_lcs(X, Y, i, j + 1, memo))
    return memo[(i, j)]

def matches(i, j, X, Y, m, memo=None):
    if i == len(X) or j == len(Y):
        return
    if X[i] == Y[j]:
        m.append(i) 
        matches(i + 1, j + 1, X, Y, m, memo)
    else:
        if memo[(i, j + 1)] >= memo[(i + 1, j)]:
            matches(i, j + 1, X, Y, m, memo)
        else:
            matches(i + 1, j, X, Y, m, memo)
    return 

def error_calculation(X, Y):
    memo = {}
    lcs_length = dp_lcs(X, Y, 0, 0, memo)
    print(f"LCS length: {lcs_length}")
    errors = len(X) - lcs_length 
    match_indices = []
    matches(0, 0, X, Y, match_indices, memo) 
    track = []
    for i in range(len(X)):
        if i not in match_indices:
            track.append(X[i])
    return errors, track


def collect_files(folder):
    save_path = []
    files = os.listdir(folder)
    for i in range(0, len(files)):
        files[i] = os.path.join(folder, files[i])
        if os.path.isfile(files[i]):
            save_path.append(files[i])
    return save_path 

def read_from_json(file_name):
    # Replace 'your_file_name.json' with the actual path to your file
    try:
        with open(file_name, 'r', encoding='utf-8') as file:
            # json.load() reads the file object and parses the JSON content
            data = json.load(file)
        
        # 'data' is now a Python object (usually a dictionary or list)
        print(type(data))
        print(data)
        return data 

    except FileNotFoundError:
        print(f"Error: The file 'your_file_name.json' was not found.")
    except json.JSONDecodeError:
        print(f"Error: The content of 'your_file_name.json' is not valid JSON.")
        pass 
    
def make_sentence(json_data):
    print("came ", json_data)
    predicted_words = json_data['output']['predicted_words']
    sentence = ""
    for i in range(0, len(predicted_words)):
        if predicted_words[i].get('word') != " ":
            sentence = sentence + " " + predicted_words[i].get('word')
    sentence = sentence.strip()
    return sentence 
        

def read_from_text(file_path):
    """
    Reads a text file by trying common encodings (UTF-8, Latin-1, CP1252)
    until one succeeds.

    Args:
        file_path (str): The path to the text file.

    Returns:
        str: The contents of the file as a single string, or None if reading fails.
    """
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return ""
        
    # The order matters: start with the preferred/modern encoding (UTF-8)
    encodings_to_try = ['utf-8', 'latin-1', 'cp1252']
    
    for encoding in encodings_to_try:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                # Read the entire file content
                content = f.read()
                print(f"Successfully read file with encoding: {encoding}")
                return content
        except UnicodeDecodeError:
            # If the current encoding fails, the loop continues to the next one
            continue
        except Exception as e:
            # Catch other potential I/O errors (e.g., permission denied)
            print(f"An unexpected error occurred while reading with {encoding}: {e}")
            return ""
            
    # If the loop completes without returning, none of the encodings worked
    print(f"Failed to decode file {file_path} with all tested encodings.")
    return ""

def process(base, api_output, statistics_file_name='error_statistics.csv', counter = -1):

    f = open(os.path.join(statistics_file_name), 'w', newline="", encoding='utf-8') # newly creation 
    csv_writer = csv.writer(f)
    csv_writer.writerow(['file_name', 'annotated', 'generated', 'total_characters', 'total_words', 'cer', 'wer', 'missed_characters'])

    f_base = collect_files(base)
    flag = {}
    for i in range(0, len(f_base)):
        basename = os.path.basename(f_base[i])
        flag[basename.split('.')[0]] = f_base[i]
    f_api = collect_files(api_output)
    print(len(f_api), len(f_base))
    tot = 0 
    for i in range(0, len(f_api)):
        tot += 1 
        basename = os.path.basename(f_api[i]).split('.')[0]
        print(f"basename {basename} {flag.get(basename)}")
        if flag.get(basename) is not None: # file found 
            json_data = read_from_json(f_api[i])
            # get sentence 
            api_sen = make_sentence(json_data)
            # actual sentence 
            base_sen = read_from_text(flag.get(basename))
            print(f"base sentence {base_sen} api reported sentence {api_sen}")
            cer, track = error_calculation(X=base_sen, Y=api_sen)
            w_base_sen = base_sen.split(' ')
            w_api_sen = api_sen.split(' ')
            wer,_ = error_calculation(X=w_base_sen, Y=w_api_sen)

            f = open(os.path.join(statistics_file_name), 'a+', newline="", encoding='utf-8') # newly creation 
            csv_writer = csv.writer(f)
            csv_writer.writerow([basename, base_sen, api_sen, len(base_sen), len(w_base_sen), cer, wer, str(track)])
            if counter != -1 and tot == counter:
                break
            f.close()
        else:
            print(f"Missed file {f_api[i]}")
        
        
if __name__ == '__main__':
    process(base=os.path.join('..', 'Final_data_MRK', 'text', ), 
            api_output=os.path.join('..', 'Final_data_MRK', 'api_response'), statistics_file_name='error_statistics.csv', counter = -1)
    