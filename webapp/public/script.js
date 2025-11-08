class AudioFileBrowser {
    normalizePath(pathStr) {
        if (!pathStr) return '';
        return pathStr
            .replace(/\\/g, '/')
            .replace(/\/+/g, '/')
            .replace(/^\//, '')
            .replace(/\/$/, '');
    }
    
    constructor() {
        this.currentPath = '';
        this.pathHistory = [];
        this.selectedFile = null;
        this.currentTranscript = null;
        this.currentReference = null;
        this.sessionId = localStorage.getItem('audioFileBrowserSession');
        this.username = localStorage.getItem('audioFileBrowserUsername');
        
        // Clear any saved paths from previous sessions
        localStorage.removeItem('audioFileBrowserLastPath');
        
        if (!this.sessionId) {
            window.location.href = '/login.html';
            return;
        }
        
        this.initializeElements();
        this.bindEvents();
        
        // Always start at root directory
        this.loadDirectory('');
        
        this.updateUserInfo();
    }
    
    initializeElements() {
        this.fileList = document.getElementById('fileList');
        this.backBtn = document.getElementById('backBtn');
        this.currentPathSpan = document.getElementById('currentPath');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.currentFileSpan = document.getElementById('currentFile');
        this.transcriptContent = document.getElementById('transcriptContent');
        this.referenceContent = document.getElementById('referenceContent');
        this.transcriptionStatus = document.getElementById('transcriptionStatus');
        this.fileMetadata = document.getElementById('fileMetadata');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userInfo = document.getElementById('userInfo');
        
        // Annotation elements
        this.copyAndSaveBtn = document.getElementById('copyAndSave');
        this.annotationStatus = document.getElementById('annotationStatus');
        this.copyReferenceBtn = document.getElementById('copyReference');
        this.copyAPIBtn = document.getElementById('copyAPI');
    }
    
    bindEvents() {
        this.backBtn.addEventListener('click', () => this.goBack());
        this.logoutBtn.addEventListener('click', () => this.logout());
        this.copyAndSaveBtn.addEventListener('click', () => this.copyAndSave());
        this.copyReferenceBtn.addEventListener('click', () => this.copyToClipboard('reference'));
        this.copyAPIBtn.addEventListener('click', () => this.copyToClipboard('api'));
        
        // Add listeners to transcript correctness radio buttons to enable/disable ideal transcript
        document.querySelectorAll('input[name="refCorrect"], input[name="modelCorrect"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateIdealTranscriptState());
        });
        
        document.addEventListener('keydown', (e) => {
            const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
            
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                if (!isTyping) {
                    e.preventDefault();
                    this.navigateFiles(e.key === 'ArrowUp' ? -1 : 1);
                }
            } else if (e.key === 'Enter' && !isTyping) {
                this.activateSelectedFile();
            } else if (e.key === 'Backspace' && !this.backBtn.disabled && !isTyping) {
                e.preventDefault();
                this.goBack();
            }
        });
    }
    
    async copyToClipboard(type) {
        const text = type === 'reference' ? this.referenceContent.textContent : this.transcriptContent.textContent;
        
        try {
            await navigator.clipboard.writeText(text);
            const btn = type === 'reference' ? this.copyReferenceBtn : this.copyAPIBtn;
            const originalText = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => btn.textContent = originalText, 1000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }
    
    updateIdealTranscriptState() {
        const refCorrectYes = document.getElementById('annRefCorrectYes').checked;
        const modelCorrectYes = document.getElementById('annModelCorrectYes').checked;
        const idealTranscript = document.getElementById('annIdealTranscript');
        
        // Disable if either is correct
        if (refCorrectYes || modelCorrectYes) {
            idealTranscript.disabled = true;
            idealTranscript.value = '';
            idealTranscript.placeholder = 'Not needed (at least one transcript is correct)';
        } else {
            idealTranscript.disabled = false;
            idealTranscript.placeholder = 'Enter the correct transcript...';
        }
    }
    
    async copyAndSave() {
        try {
            // Collect background noise checkboxes
            const noises = [];
            if (document.getElementById('annNoiseMusic').checked) noises.push('Music');
            if (document.getElementById('annNoiseCrowd').checked) noises.push('Crowd');
            if (document.getElementById('annNoiseTraffic').checked) noises.push('Traffic');
            if (document.getElementById('annNoiseEcho').checked) noises.push('Echo');
            
            const filename = document.getElementById('annFilename').value;
            
            if (!filename) {
                this.annotationStatus.textContent = 'No file selected';
                this.annotationStatus.className = 'annotation-status error';
                return;
            }
            
            // Get radio button values
            const refCorrect = document.querySelector('input[name="refCorrect"]:checked')?.value || '';
            const modelCorrect = document.querySelector('input[name="modelCorrect"]:checked')?.value || '';
            const properNoun = document.querySelector('input[name="properNoun"]:checked')?.value || '';
            const accentVariation = document.querySelector('input[name="accentVariation"]:checked')?.value || '';
            const numericDate = document.querySelector('input[name="numericDate"]:checked')?.value || '';
            const homophone = document.querySelector('input[name="homophone"]:checked')?.value || '';
            const foreignLanguage = document.querySelector('input[name="foreignLanguage"]:checked')?.value || '';
            const gender = document.querySelector('input[name="gender"]:checked')?.value || '';
            
            const idealTranscript = document.getElementById('annIdealTranscript').value || '';
            const backgroundNoise = noises.length > 0 ? noises.join(', ') : 'None';
            const audioQuality = document.getElementById('annAudioQuality').value || '';
            const notes = document.getElementById('annNotes').value || '';
            
            // 1. Copy to clipboard for Google Sheets
            const rowData = [
                filename,
                document.getElementById('annDuration').value || '',
                this.referenceContent.textContent || '',
                this.transcriptContent.textContent || '',
                refCorrect,
                modelCorrect,
                idealTranscript,
                properNoun,
                accentVariation,
                numericDate,
                homophone,
                foreignLanguage,
                gender,
                backgroundNoise,
                audioQuality,
                notes
            ];
            
            const tsvData = rowData.join('\t');
            await navigator.clipboard.writeText(tsvData);
            
            // 2. Save annotation to server
            const annotation = {
                filename,
                duration: document.getElementById('annDuration').value,
                refCorrect,
                modelCorrect,
                idealTranscript,
                properNoun,
                accentVariation,
                numericDate,
                homophone,
                foreignLanguage,
                gender,
                backgroundNoise,
                audioQuality,
                notes
            };
            
            this.annotationStatus.textContent = 'Copying & Saving...';
            this.annotationStatus.className = 'annotation-status';
            
            const response = await fetch('/api/annotation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': this.sessionId
                },
                body: JSON.stringify(annotation)
            });
            
            if (response.ok) {
                // Visual feedback
                const originalText = this.copyAndSaveBtn.textContent;
                this.copyAndSaveBtn.textContent = '✓ Copied & Saved!';
                this.copyAndSaveBtn.style.background = '#218838';
                
                this.annotationStatus.textContent = 'Copied to clipboard & saved!';
                this.annotationStatus.className = 'annotation-status success';
                
                setTimeout(() => {
                    this.copyAndSaveBtn.textContent = originalText;
                    this.copyAndSaveBtn.style.background = '';
                    this.annotationStatus.textContent = '';
                }, 3000);
            } else {
                throw new Error('Failed to save annotation');
            }
            
        } catch (error) {
            console.error('Failed to copy and save:', error);
            this.copyAndSaveBtn.textContent = '✗ Failed';
            this.annotationStatus.textContent = 'Error: ' + error.message;
            this.annotationStatus.className = 'annotation-status error';
            
            setTimeout(() => {
                this.copyAndSaveBtn.textContent = '📋 Copy & Save';
            }, 2000);
        }
    }
    
    async loadDirectory(path) {
        try {
            this.fileList.innerHTML = '<div class="loading">Loading files...</div>';
            
            const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}`, {
                headers: { 'x-session-id': this.sessionId }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    this.handleAuthError();
                    return;
                }
                throw new Error(data.error || 'Failed to load directory');
            }
            
            this.currentPath = data.currentPath;
            this.updateUI(data);
            this.renderFileList(data.items);
            
        } catch (error) {
            console.error('LoadDirectory error:', error);
            this.fileList.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }
    
    updateUI(data) {
        this.currentPathSpan.textContent = data.currentPath || 'validated';
        this.breadcrumb.textContent = `Path: ${data.currentPath || 'validated'}`;
        this.backBtn.disabled = this.pathHistory.length === 0;
    }
    
    renderFileList(items) {
        if (items.length === 0) {
            this.fileList.innerHTML = '<div class="loading">No files found</div>';
            return;
        }
        
        items.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
        
        this.fileList.innerHTML = '';
        
        items.forEach((item, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.index = index;
            fileItem.dataset.type = item.type;
            fileItem.dataset.path = item.path;
            
            const serial = document.createElement('span');
            serial.className = 'file-serial';
            serial.textContent = (index + 1).toString().padStart(2, '0');
            
            const icon = document.createElement('span');
            icon.className = `file-icon ${item.type}-icon`;
            icon.textContent = item.type === 'folder' ? '📁' : '🎵';
            
            const name = document.createElement('span');
            name.className = 'file-name';
            name.textContent = item.name;
            
            if (item.type === 'folder' && item.fileCount !== undefined) {
                const count = document.createElement('span');
                count.className = 'file-count';
                count.textContent = `${item.fileCount} files`;
                name.appendChild(count);
            }
            
            fileItem.appendChild(serial);
            fileItem.appendChild(icon);
            fileItem.appendChild(name);
            
            fileItem.addEventListener('click', () => this.selectFile(fileItem, item));
            fileItem.addEventListener('dblclick', () => this.activateFile(item));
            
            this.fileList.appendChild(fileItem);
        });
        
        if (items.length > 0) {
            const firstItem = this.fileList.querySelector('.file-item');
            this.selectFileElement(firstItem);
        }
    }
    
    selectFile(element, item) {
        this.fileList.querySelectorAll('.file-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        element.classList.add('selected');
        this.selectedFile = item;
        
        if (item.type === 'audio') {
            this.loadAudioFile(item);
        }
    }
    
    selectFileElement(element) {
        if (!element) return;
        
        const type = element.dataset.type;
        const path = element.dataset.path;
        
        const item = {
            type: type,
            path: path,
            name: element.querySelector('.file-name').textContent
        };
        
        if (type === 'audio') {
            item.audioFile = path;
            item.jsonFile = path.replace(/\.(flac|wav|mp3|m4a|ogg)$/i, '.json');
        }
        
        this.selectFile(element, item);
    }
    
    navigateFiles(direction) {
        const items = this.fileList.querySelectorAll('.file-item');
        const selected = this.fileList.querySelector('.file-item.selected');
        
        if (!selected || items.length === 0) return;
        
        const currentIndex = Array.from(items).indexOf(selected);
        let newIndex = currentIndex + direction;
        
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;
        
        this.selectFileElement(items[newIndex]);
        items[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    activateSelectedFile() {
        if (this.selectedFile) {
            this.activateFile(this.selectedFile);
        }
    }
    
    activateFile(item) {
        if (item.type === 'folder') {
            this.pathHistory.push(this.currentPath);
            this.loadDirectory(item.path);
        } else if (item.type === 'audio') {
            this.loadAudioFile(item);
        }
    }
    
    async loadAudioFile(item) {
        try {
            this.audioPlayer.src = `/audio/${item.audioFile}?session=${encodeURIComponent(this.sessionId)}`;
            this.currentFileSpan.textContent = item.name;
            
            this.transcriptionStatus.textContent = 'Loading transcripts...';
            this.transcriptionStatus.className = 'transcription-status loading';
            this.transcriptContent.textContent = 'Loading...';
            this.referenceContent.textContent = 'Loading...';
            
            // Fetch transcripts and annotation in parallel
            const [apiResponse, refResponse, annResponse] = await Promise.all([
                fetch(`/api/transcript?file=${encodeURIComponent(item.audioFile)}`, {
                    headers: { 'x-session-id': this.sessionId }
                }),
                fetch(`/api/reference?file=${encodeURIComponent(item.audioFile)}`, {
                    headers: { 'x-session-id': this.sessionId }
                }),
                fetch(`/api/annotation?file=${encodeURIComponent(item.audioFile)}`, {
                    headers: { 'x-session-id': this.sessionId }
                })
            ]);
            
            // Handle Model transcript
            if (apiResponse.ok) {
                const transcript = await apiResponse.json();
                this.currentTranscript = transcript;
                this.displayTranscript(transcript);
                this.transcriptionStatus.textContent = 'Transcripts loaded';
                this.transcriptionStatus.className = 'transcription-status success';
            } else {
                this.transcriptContent.textContent = 'Model transcript not available';
                this.currentTranscript = null;
                this.transcriptionStatus.textContent = 'Model transcript not found';
                this.transcriptionStatus.className = 'transcription-status error';
            }
            
            // Handle reference data
            if (refResponse.ok) {
                const reference = await refResponse.json();
                this.currentReference = reference;
                this.referenceContent.textContent = reference.sentence || 'No reference available';
                this.displayMetadata(reference);
                this.populateAnnotationForm(item.name, reference);
                
                // Highlight differences after both transcripts are loaded
                this.highlightDifferences();
            } else {
                this.referenceContent.textContent = 'Reference transcript not available';
                this.currentReference = null;
                this.populateAnnotationForm(item.name, null);
            }
            
            // Handle existing annotation
            if (annResponse.ok) {
                const annotation = await annResponse.json();
                this.loadAnnotation(annotation);
            } else {
                this.clearAnnotationForm();
            }
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.transcriptContent.textContent = 'Error loading transcript';
            this.referenceContent.textContent = 'Error loading reference';
            this.transcriptionStatus.textContent = 'Error';
            this.transcriptionStatus.className = 'transcription-status error';
        }
    }
    
    displayTranscript(transcript) {
        let text = '';
        
        if (transcript.transcript) {
            text = transcript.transcript;
        } else if (transcript.output && transcript.output.predicted_words) {
            text = transcript.output.predicted_words
                .map(item => item.word)
                .join('');
        } else if (typeof transcript === 'string') {
            text = transcript;
        } else {
            text = JSON.stringify(transcript, null, 2);
        }
        
        // Store the plain text for comparison
        this.modelTranscriptText = text;
        
        // Highlight differences if we have both transcripts
        this.highlightDifferences();
    }
    
    // Unicode-aware utilities
    canonMap(text) {
        // Minimal canonical map for Bengali
        const BENGALI_CANON_MAP = new Map([
            ['য়', 'য'],
            ['্‌', '্']
        ]);
        return text.split('').map(ch => BENGALI_CANON_MAP.get(ch) ?? ch).join('');
    }
    
    normalizeForComparison(text) {
        const ZW = /[\u200B-\u200D\uFEFF]/g; // Zero-width characters
        return this.canonMap(
            text.normalize('NFC')
                .replace(ZW, '')
                .replace(/[\p{P}\p{S}]+/gu, '') // Remove punctuation & symbols
                .replace(/\s+/g, ' ')
                .trim()
        );
    }
    
    tokenizeWordsPreserveWhitespace(text) {
        // Use Intl.Segmenter for proper Bengali word segmentation
        if (typeof Intl.Segmenter !== 'undefined') {
            const seg = new Intl.Segmenter('bn', { granularity: 'word' });
            const tokens = [];
            for (const { segment } of seg.segment(text.normalize('NFC'))) {
                tokens.push(segment);
            }
            return tokens;
        } else {
            // Fallback for browsers without Intl.Segmenter
            return text.normalize('NFC').match(/\S+|\s+/g) || [];
        }
    }
    
    graphemes(text) {
        // Grapheme segmentation for character-level diffs
        if (typeof Intl.Segmenter !== 'undefined') {
            const seg = new Intl.Segmenter('bn', { granularity: 'grapheme' });
            return Array.from(seg.segment(text), s => s.segment);
        } else {
            return text.split('');
        }
    }
    
    lcsDiff(a, b, areEq) {
        const n = a.length, m = b.length;
        const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
        
        for (let i = n - 1; i >= 0; i--) {
            for (let j = m - 1; j >= 0; j--) {
                dp[i][j] = areEq(a[i], b[j]) 
                    ? 1 + dp[i + 1][j + 1]
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
        
        const result = [];
        let i = 0, j = 0;
        while (i < n && j < m) {
            if (areEq(a[i], b[j])) {
                result.push({ type: 'equal', a: a[i], b: b[j] });
                i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                result.push({ type: 'delete', a: a[i] }); 
                i++;
            } else {
                result.push({ type: 'insert', b: b[j] }); 
                j++;
            }
        }
        while (i < n) result.push({ type: 'delete', a: a[i++] });
        while (j < m) result.push({ type: 'insert', b: b[j++] });
        
        // Merge adjacent delete+insert pairs into replace
        const merged = [];
        for (let k = 0; k < result.length; k++) {
            const cur = result[k], next = result[k + 1];
            if (cur?.type === 'delete' && next?.type === 'insert') {
                merged.push({ type: 'replace', a: cur.a, b: next.b });
                k++;
            } else {
                merged.push(cur);
            }
        }
        return merged;
    }
    
    innerReplaceMarkup(aText, bText) {
        const A = this.graphemes(aText);
        const B = this.graphemes(bText);
        const eq = (x, y) => this.normalizeForComparison(x) === this.normalizeForComparison(y);
        const ops = this.lcsDiff(A, B, eq);
        
        let out = '';
        for (const op of ops) {
            if (op.type === 'equal') {
                out += this.escapeHtml(op.b ?? op.a);
            } else if (op.type === 'insert') {
                out += `<span class="diff-ins-ch">${this.escapeHtml(op.b)}</span>`;
            } else if (op.type === 'delete') {
                // Hidden in model view
            } else if (op.type === 'replace') {
                out += `<span class="diff-rep-ch">${this.escapeHtml(op.b)}</span>`;
            }
        }
        return out;
    }
    
    highlightDifferences() {
        const referenceText = (this.referenceContent.textContent || '').trim();
        const modelText = (this.modelTranscriptText || '').trim();
        
        if (!referenceText || !modelText || 
            referenceText === 'Select an audio file to view the reference transcript') {
            this.transcriptContent.textContent = modelText;
            return;
        }
        
        const refTokens = this.tokenizeWordsPreserveWhitespace(referenceText);
        const modelTokens = this.tokenizeWordsPreserveWhitespace(modelText);
        
        const isSpace = t => /^\s+$/u.test(t);
        const areEq = (x, y) => {
            if (isSpace(x) && isSpace(y)) return true;
            if (isSpace(x) || isSpace(y)) return false;
            return this.normalizeForComparison(x) === this.normalizeForComparison(y);
        };
        
        const ops = this.lcsDiff(refTokens, modelTokens, areEq);
        
        let html = '';
        for (const op of ops) {
            if (op.type === 'equal') {
                const token = op.b ?? op.a;
                html += this.escapeHtml(token);
            } else if (op.type === 'insert') {
                html += isSpace(op.b)
                    ? this.escapeHtml(op.b)
                    : `<span class="diff-insert" title="Added in model">${this.escapeHtml(op.b)}</span>`;
            } else if (op.type === 'delete') {
                // Skip in model view
            } else if (op.type === 'replace') {
                html += `<span class="diff-replace" title="Different from reference">${this.innerReplaceMarkup(op.a, op.b)}</span>`;
            }
        }
        
        this.transcriptContent.innerHTML = html || this.escapeHtml(modelText);
    }
    
    escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }
    
    displayMetadata(reference) {
        const metadata = [];
        
        // Helper to check if value is meaningful
        const isValid = (value) => {
            if (!value) return false;
            const lower = value.toLowerCase();
            return !lower.includes('unknown') && value.trim() !== '';
        };
        
        // Parse demographics to extract individual fields
        let gender = reference.gender || '';
        let age = reference.age || '';
        let accent = reference.accents || '';
        
        // If demog_group exists, try to parse it (format: gender|age|accent)
        if (reference.demog_group) {
            const parts = reference.demog_group.split('|');
            if (parts.length >= 3) {
                if (!gender || !isValid(gender)) gender = parts[0];
                if (!age || !isValid(age)) age = parts[1];
                if (!accent || !isValid(accent)) accent = parts[2];
            }
        }
        
        // Add valid fields only
        if (isValid(age)) {
            metadata.push(`<span class="metadata-item"><span class="metadata-label">Age:</span> ${age}</span>`);
        }
        if (isValid(gender)) {
            metadata.push(`<span class="metadata-item"><span class="metadata-label">Gender:</span> ${gender}</span>`);
        }
        if (isValid(accent)) {
            metadata.push(`<span class="metadata-item"><span class="metadata-label">Accent:</span> ${accent}</span>`);
        }
        if (isValid(reference.variant)) {
            metadata.push(`<span class="metadata-item"><span class="metadata-label">Variant:</span> ${reference.variant}</span>`);
        }
        
        this.fileMetadata.innerHTML = metadata.length > 0 ? metadata.join('') : '<span class="metadata-item">No metadata available</span>';
    }
    
    populateAnnotationForm(filename, reference) {
        document.getElementById('annFilename').value = filename;
        document.getElementById('annDuration').value = reference?.duration_s || '';
        
        // Pre-fill gender from CSV
        const gender = reference?.gender || '';
        if (gender.toLowerCase().includes('male') && !gender.toLowerCase().includes('female')) {
            document.getElementById('annGenderM').checked = true;
        } else if (gender.toLowerCase().includes('female')) {
            document.getElementById('annGenderF').checked = true;
        } else {
            document.getElementById('annGenderUnknown').checked = true;
        }
    }
    
    clearAnnotationForm() {
        // Clear radio buttons
        document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
        
        // Clear checkboxes
        const checkboxes = ['annNoiseMusic', 'annNoiseCrowd', 'annNoiseTraffic', 'annNoiseEcho'];
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.checked = false;
        });
        
        // Clear text fields
        document.getElementById('annIdealTranscript').value = '';
        document.getElementById('annIdealTranscript').disabled = false;
        document.getElementById('annNotes').value = '';
        
        // Clear select
        document.getElementById('annAudioQuality').value = '';
    }
    
    loadAnnotation(annotation) {
        // Load radio buttons
        if (annotation.refCorrect === 'yes') document.getElementById('annRefCorrectYes').checked = true;
        else if (annotation.refCorrect === 'no') document.getElementById('annRefCorrectNo').checked = true;
        
        if (annotation.modelCorrect === 'yes') document.getElementById('annModelCorrectYes').checked = true;
        else if (annotation.modelCorrect === 'no') document.getElementById('annModelCorrectNo').checked = true;
        
        if (annotation.properNoun === 'yes') document.getElementById('annProperNounYes').checked = true;
        else if (annotation.properNoun === 'no') document.getElementById('annProperNounNo').checked = true;
        
        if (annotation.accentVariation === 'yes') document.getElementById('annAccentVariationYes').checked = true;
        else if (annotation.accentVariation === 'no') document.getElementById('annAccentVariationNo').checked = true;
        
        if (annotation.numericDate === 'yes') document.getElementById('annNumericDateYes').checked = true;
        else if (annotation.numericDate === 'no') document.getElementById('annNumericDateNo').checked = true;
        
        if (annotation.homophone === 'yes') document.getElementById('annHomophoneYes').checked = true;
        else if (annotation.homophone === 'no') document.getElementById('annHomophoneNo').checked = true;
        
        if (annotation.foreignLanguage === 'yes') document.getElementById('annForeignLanguageYes').checked = true;
        else if (annotation.foreignLanguage === 'no') document.getElementById('annForeignLanguageNo').checked = true;
        
        if (annotation.gender === 'M') document.getElementById('annGenderM').checked = true;
        else if (annotation.gender === 'F') document.getElementById('annGenderF').checked = true;
        else if (annotation.gender === 'Unknown') document.getElementById('annGenderUnknown').checked = true;
        
        // Load background noise checkboxes
        const noises = (annotation.backgroundNoise || '').split(',').map(n => n.trim());
        document.getElementById('annNoiseMusic').checked = noises.includes('Music');
        document.getElementById('annNoiseCrowd').checked = noises.includes('Crowd');
        document.getElementById('annNoiseTraffic').checked = noises.includes('Traffic');
        document.getElementById('annNoiseEcho').checked = noises.includes('Echo');
        
        // Load text fields
        document.getElementById('annIdealTranscript').value = annotation.idealTranscript || '';
        document.getElementById('annNotes').value = annotation.notes || '';
        
        // Load select
        document.getElementById('annAudioQuality').value = annotation.audioQuality || '';
        
        // Update ideal transcript state
        this.updateIdealTranscriptState();
        
        this.annotationStatus.textContent = `Last saved: ${new Date(annotation.timestamp).toLocaleString()}`;
        this.annotationStatus.className = 'annotation-status';
    }
    
    async saveAnnotation() {
        try {
            // Collect background noise checkboxes
            const noises = [];
            if (document.getElementById('annNoiseMusic').checked) noises.push('Music');
            if (document.getElementById('annNoiseCrowd').checked) noises.push('Crowd');
            if (document.getElementById('annNoiseTraffic').checked) noises.push('Traffic');
            if (document.getElementById('annNoiseEcho').checked) noises.push('Echo');
            
            const annotation = {
                filename: document.getElementById('annFilename').value,
                duration: document.getElementById('annDuration').value,
                refCorrect: document.getElementById('annRefCorrect').checked ? 'yes' : 'no',
                modelCorrect: document.getElementById('annModelCorrect').checked ? 'yes' : 'no',
                idealTranscript: document.getElementById('annIdealTranscript').value,
                properNoun: document.getElementById('annProperNoun').checked ? 'yes' : 'no',
                accentVariation: document.getElementById('annAccentVariation').checked ? 'yes' : 'no',
                numericDate: document.getElementById('annNumericDate').checked ? 'yes' : 'no',
                homophone: document.getElementById('annHomophone').checked ? 'yes' : 'no',
                foreignLanguage: document.getElementById('annForeignLanguage').checked ? 'yes' : 'no',
                gender: document.getElementById('annGender').value,
                backgroundNoise: noises.length > 0 ? noises.join(', ') : 'None',
                audioQuality: document.getElementById('annAudioQuality').value,
                notes: document.getElementById('annNotes').value
            };
            
            if (!annotation.filename) {
                this.annotationStatus.textContent = 'No file selected';
                this.annotationStatus.className = 'annotation-status error';
                return;
            }
            
            this.annotationStatus.textContent = 'Saving...';
            this.annotationStatus.className = 'annotation-status';
            
            const response = await fetch('/api/annotation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': this.sessionId
                },
                body: JSON.stringify(annotation)
            });
            
            if (response.ok) {
                this.annotationStatus.textContent = 'Saved successfully!';
                this.annotationStatus.className = 'annotation-status success';
                setTimeout(() => {
                    this.annotationStatus.textContent = '';
                }, 3000);
            } else {
                throw new Error('Failed to save annotation');
            }
            
        } catch (error) {
            console.error('Error saving annotation:', error);
            this.annotationStatus.textContent = 'Error saving annotation';
            this.annotationStatus.className = 'annotation-status error';
        }
    }
    
    goBack() {
        if (this.pathHistory.length > 0) {
            const previousPath = this.pathHistory.pop();
            this.loadDirectory(previousPath);
        }
    }
    
    updateUserInfo() {
        if (this.userInfo && this.username) {
            this.userInfo.textContent = `Logged in as: ${this.username}`;
        }
    }
    
    handleAuthError() {
        localStorage.removeItem('audioFileBrowserSession');
        localStorage.removeItem('audioFileBrowserUsername');
        window.location.href = '/login.html';
    }
    
    async logout() {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: { 'x-session-id': this.sessionId }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('audioFileBrowserSession');
            localStorage.removeItem('audioFileBrowserUsername');
            window.location.href = '/login.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AudioFileBrowser();
});
