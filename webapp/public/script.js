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
        this.sessionId = localStorage.getItem('audioFileBrowserSession');
        this.username = localStorage.getItem('audioFileBrowserUsername');
        
        console.log('Session ID:', this.sessionId);
        console.log('Username:', this.username);
        
        if (!this.sessionId) {
            console.log('No session, redirecting to login');
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
        this.transcriptionStatus = document.getElementById('transcriptionStatus');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.userInfo = document.getElementById('userInfo');
    }
    
    bindEvents() {
        this.backBtn.addEventListener('click', () => this.goBack());
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        document.addEventListener('keydown', (e) => {
            const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
            
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
    
    async loadDirectory(path) {
        try {
            console.log('Loading directory:', path);
            this.fileList.innerHTML = '<div class="loading">Loading files...</div>';
            
            const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}`, {
                headers: {
                    'x-session-id': this.sessionId
                }
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
        this.currentPathSpan.textContent = data.currentPath || 'Root';
        this.breadcrumb.textContent = `Path: ${data.currentPath || '/'}`;
        this.backBtn.disabled = this.pathHistory.length === 0 && !data.currentPath;
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
            
            // Show loading status
            this.transcriptionStatus.textContent = 'Loading transcript...';
            this.transcriptionStatus.className = 'transcription-status loading';
            this.transcriptContent.textContent = 'Loading...';
            
            // Fetch transcript (will generate if not exists)
            const response = await fetch(`/api/transcript?file=${encodeURIComponent(item.audioFile)}`, {
                headers: {
                    'x-session-id': this.sessionId
                }
            });
            
            if (response.ok) {
                const transcript = await response.json();
                this.currentTranscript = transcript;
                this.displayTranscript(transcript);
                this.transcriptionStatus.textContent = 'Transcript loaded';
                this.transcriptionStatus.className = 'transcription-status success';
            } else {
                this.transcriptContent.textContent = 'Transcript not available';
                this.currentTranscript = null;
                this.transcriptionStatus.textContent = 'Failed to load transcript';
                this.transcriptionStatus.className = 'transcription-status error';
            }
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.transcriptContent.textContent = 'Error loading transcript';
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
    
    goBack() {
        if (this.pathHistory.length > 0) {
            const previousPath = this.pathHistory.pop();
            this.loadDirectory(previousPath);
        } else if (this.currentPath) {
            const pathParts = this.currentPath.split('/').filter(part => part.length > 0);
            if (pathParts.length > 0) {
                pathParts.pop();
                const parentPath = pathParts.join('/');
                this.loadDirectory(parentPath);
            } else {
                this.loadDirectory('');
            }
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
                headers: {
                    'x-session-id': this.sessionId
                }
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
