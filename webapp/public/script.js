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
        
        if (!this.sessionId) {
            window.location.href = '/login.html';
            return;
        }
        
        this.initializeElements();
        this.bindEvents();
        
        const savedPath = localStorage.getItem('audioFileBrowserLastPath') || '';
        this.loadDirectory(savedPath);
        
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
        this.saveAnnotationBtn = document.getElementById('saveAnnotation');
        this.copyRowDataBtn = document.getElementById('copyRowData');
        this.annotationStatus = document.getElementById('annotationStatus');
        this.copyReferenceBtn = document.getElementById('copyReference');
        this.copyAPIBtn = document.getElementById('copyAPI');
    }
    
    bindEvents() {
        this.backBtn.addEventListener('click', () => this.goBack());
        this.logoutBtn.addEventListener('click', () => this.logout());
        this.saveAnnotationBtn.addEventListener('click', () => this.saveAnnotation());
        this.copyRowDataBtn.addEventListener('click', () => this.copyRowData());
        this.copyReferenceBtn.addEventListener('click', () => this.copyToClipboard('reference'));
        this.copyAPIBtn.addEventListener('click', () => this.copyToClipboard('api'));
        
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
    
    async copyRowData() {
        try {
            // Collect background noise checkboxes
            const noises = [];
            if (document.getElementById('annNoiseMusic').checked) noises.push('Music');
            if (document.getElementById('annNoiseCrowd').checked) noises.push('Crowd');
            if (document.getElementById('annNoiseTraffic').checked) noises.push('Traffic');
            if (document.getElementById('annNoiseEcho').checked) noises.push('Echo');
            
            // Get all form values in the order they should appear in Google Sheets
            const rowData = [
                document.getElementById('annFilename').value || '',
                document.getElementById('annDuration').value || '',
                this.referenceContent.textContent || '',
                this.transcriptContent.textContent || '',
                document.getElementById('annRefCorrect').checked ? 'yes' : 'no',
                document.getElementById('annModelCorrect').checked ? 'yes' : 'no',
                document.getElementById('annIdealTranscript').value || '',
                document.getElementById('annProperNoun').checked ? 'yes' : 'no',
                document.getElementById('annAccentVariation').checked ? 'yes' : 'no',
                document.getElementById('annNumericDate').checked ? 'yes' : 'no',
                document.getElementById('annHomophone').checked ? 'yes' : 'no',
                document.getElementById('annForeignLanguage').checked ? 'yes' : 'no',
                document.getElementById('annGender').value || '',
                noises.length > 0 ? noises.join(', ') : 'None',
                document.getElementById('annAudioQuality').value || '',
                document.getElementById('annNotes').value || ''
            ];
            
            // Join with tabs for Google Sheets paste
            const tsvData = rowData.join('\t');
            
            await navigator.clipboard.writeText(tsvData);
            
            // Visual feedback
            const originalText = this.copyRowDataBtn.textContent;
            this.copyRowDataBtn.textContent = '✓ Copied!';
            this.copyRowDataBtn.style.background = '#218838';
            
            setTimeout(() => {
                this.copyRowDataBtn.textContent = originalText;
                this.copyRowDataBtn.style.background = '';
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy row data:', error);
            this.copyRowDataBtn.textContent = '✗ Failed';
            setTimeout(() => {
                this.copyRowDataBtn.textContent = '📋 Copy Row Data';
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
            
            localStorage.setItem('audioFileBrowserLastPath', this.currentPath);
            
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
            
            // Handle API transcript
            if (apiResponse.ok) {
                const transcript = await apiResponse.json();
                this.currentTranscript = transcript;
                this.displayTranscript(transcript);
                this.transcriptionStatus.textContent = 'Transcripts loaded';
                this.transcriptionStatus.className = 'transcription-status success';
            } else {
                this.transcriptContent.textContent = 'API transcript not available';
                this.currentTranscript = null;
                this.transcriptionStatus.textContent = 'API transcript not found';
                this.transcriptionStatus.className = 'transcription-status error';
            }
            
            // Handle reference data
            if (refResponse.ok) {
                const reference = await refResponse.json();
                this.currentReference = reference;
                this.referenceContent.textContent = reference.sentence || 'No reference available';
                this.displayMetadata(reference);
                this.populateAnnotationForm(item.name, reference);
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
        
        this.transcriptContent.textContent = text;
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
        const genderSelect = document.getElementById('annGender');
        if (gender.toLowerCase().includes('male') && !gender.toLowerCase().includes('female')) {
            genderSelect.value = 'M';
        } else if (gender.toLowerCase().includes('female')) {
            genderSelect.value = 'F';
        } else {
            genderSelect.value = 'Unknown';
        }
    }
    
    clearAnnotationForm() {
        // Clear checkboxes
        const checkboxes = [
            'annRefCorrect', 'annModelCorrect', 'annProperNoun', 
            'annAccentVariation', 'annNumericDate', 'annHomophone', 
            'annForeignLanguage', 'annNoiseMusic', 'annNoiseCrowd',
            'annNoiseTraffic', 'annNoiseEcho'
        ];
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.checked = false;
        });
        
        // Clear text fields
        document.getElementById('annIdealTranscript').value = '';
        document.getElementById('annNotes').value = '';
        
        // Clear selects
        document.getElementById('annGender').value = '';
        document.getElementById('annAudioQuality').value = '';
    }
    
    loadAnnotation(annotation) {
        // Load checkboxes
        document.getElementById('annRefCorrect').checked = annotation.refCorrect === 'yes' || annotation.refCorrect === true;
        document.getElementById('annModelCorrect').checked = annotation.modelCorrect === 'yes' || annotation.modelCorrect === true;
        document.getElementById('annProperNoun').checked = annotation.properNoun === 'yes' || annotation.properNoun === true;
        document.getElementById('annAccentVariation').checked = annotation.accentVariation === 'yes' || annotation.accentVariation === true;
        document.getElementById('annNumericDate').checked = annotation.numericDate === 'yes' || annotation.numericDate === true;
        document.getElementById('annHomophone').checked = annotation.homophone === 'yes' || annotation.homophone === true;
        document.getElementById('annForeignLanguage').checked = annotation.foreignLanguage === 'yes' || annotation.foreignLanguage === true;
        
        // Load background noise checkboxes
        const noises = (annotation.backgroundNoise || '').split(',').map(n => n.trim());
        document.getElementById('annNoiseMusic').checked = noises.includes('Music');
        document.getElementById('annNoiseCrowd').checked = noises.includes('Crowd');
        document.getElementById('annNoiseTraffic').checked = noises.includes('Traffic');
        document.getElementById('annNoiseEcho').checked = noises.includes('Echo');
        
        // Load text fields
        document.getElementById('annIdealTranscript').value = annotation.idealTranscript || '';
        document.getElementById('annNotes').value = annotation.notes || '';
        
        // Load selects
        document.getElementById('annGender').value = annotation.gender || '';
        document.getElementById('annAudioQuality').value = annotation.audioQuality || '';
        
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
