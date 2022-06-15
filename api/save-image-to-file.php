<?php

// Parse params
if (!$_REQUEST['saveTo']) {
  http_response_code(400);
  throw new Error('"saveTo" param required');
}

if (!$_FILES['files']) {
  http_response_code(400);
  throw new Error('image file required');
}

$saveTo = '../' . $_REQUEST['saveTo'];
$saveTmp = $_FILES['files']['tmp_name'][0];

// Create folder, if needed
$path = implode(array_slice(explode('/', $saveTo), 0, -1), '/');
if (!file_exists($path)) {
  mkdir($path, 0777, true);
}

// Save file
move_uploaded_file($saveTmp, $saveTo);

// Response
http_response_code(200);
echo 'Done';

?>