<?php

include 'helper-save-file.php';

// Parse params
if (!$_REQUEST['saveTo']) {
  http_response_code(400);
  throw new Error('"saveTo" param required');
}

$saveTo = '../' . $_REQUEST['saveTo'];

// Get document
$body = file_get_contents("php://input");

// Save
helperSaveFile($saveTo, $body);

// Response
http_response_code(200);
echo 'Done';

?>