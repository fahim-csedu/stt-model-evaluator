// Configuration file for the STT Model Evaluator
const config = {
    // Base directory for audio files
    AUDIO_BASE_DIR: process.env.AUDIO_BASE_DIR || 'D:\\Final_data_MRK\\Modified',
    
    // Directory for API responses
    API_RESPONSE_DIR: process.env.API_RESPONSE_DIR || 'D:\\Final_data_MRK\\api_response',
    
    // STT API endpoint
    STT_API_URL: process.env.STT_API_URL || 'https://voice.bangla.gov.bd:9394',
    
    // Server port
    PORT: process.env.PORT || 3002,
    
    // Session timeout (in milliseconds)
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    
    // Enable debug logging
    DEBUG: process.env.NODE_ENV !== 'production'
};

module.exports = config;
