// Configuration file for the STT Model Evaluator
const config = {
    // Base directory for audio files
    AUDIO_BASE_DIR: process.env.AUDIO_BASE_DIR || 'D:\\cv_eval_bn\\validated',
    
    // Directory for transcriptions (same as audio base dir - JSON files are in same folders)
    TRANSCRIPTION_DIR: process.env.TRANSCRIPTION_DIR || 'D:\\cv_eval_bn\\validated',
    
    // Server port
    PORT: process.env.PORT || 3002,
    
    // Session timeout (in milliseconds)
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    
    // Enable debug logging
    DEBUG: process.env.NODE_ENV !== 'production'
};

module.exports = config;
