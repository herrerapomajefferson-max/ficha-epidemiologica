function doPost(e) {
  // Configuración de cabeceras para permitir CORS
  var output = ContentService.createTextOutput();
  
  try {
    // La información viene en el cuerpo (body) de la petición POST en formato JSON stringificado
    var data = JSON.parse(e.postData.contents);
    
    // Obtener la hoja activa o crear una nueva
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Obtener las claves (nombres de las columnas) del objeto JSON enviado
    var headers = Object.keys(data);
    
    // Si la hoja está completamente vacía, escribir los encabezados en la primera fila
    if (sheet.getLastRow() === 0) {
      // Agregamos una columna de Fecha de Registro al inicio
      var headerRow = ["Fecha de Registro"].concat(headers);
      sheet.appendRow(headerRow);
      
      // Congelar la fila superior y ponerla en negrita
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headerRow.length).setFontWeight("bold");
    }
    
    // Preparar la fila de datos
    // Para asegurarnos de que el orden de los datos coincida con los encabezados de la fila 1
    var firstRowHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var newRow = [new Date()]; // La primera columna es la fecha automática
    
    for (var i = 1; i < firstRowHeaders.length; i++) {
      var headerName = firstRowHeaders[i];
      newRow.push(data[headerName] || ""); // Si no hay dato para esa columna, poner vacío
    }
    
    // Agregar la fila a la hoja
    sheet.appendRow(newRow);
    
    // Respuesta de éxito
    return output
      .setMimeType(ContentService.MimeType.JSON)
      .setContent(JSON.stringify({"status": "success"}));
      
  } catch (error) {
    // Si hay un error, devolverlo
    return output
      .setMimeType(ContentService.MimeType.JSON)
      .setContent(JSON.stringify({"status": "error", "message": error.toString()}));
  }
}
