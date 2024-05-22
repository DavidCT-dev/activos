export default () => ({
    port: process.env.PORT || 3000,
    
    mongodb: process.env.MONGO_URI,
    db_name:process.env.DB_NAME,

    verify_token: process.env.API_MAIN_VERIFY_TOKEN,

    file_upload:process.env.API_FILE_UPLOAD,

    api_personal:process.env.API_PERSONAL,

    api_organigrama:process.env.API_ORGANIGRAMA,
     
    api_pdf:process.env.API_PDF
  
  });

