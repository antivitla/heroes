<?php

// Parse params
if (!$_REQUEST['from']) {
  http_response_code(400);
  throw new Error('"from" param required');
}

if (!$_REQUEST['to']) {
  http_response_code(400);
  throw new Error('"to" param required');
}

$from = '../' . $_REQUEST['from'];
$to = '../' . $_REQUEST['to'];

// Delete file, if present
if(file_exists($to)) {
  unlink($to);
}
// Create folder, if needed
$path = implode(array_slice(explode('/', $to), 0, -1), '/');
if (!file_exists($path)) {
  mkdir($path, 0777, true);
}

copy($from, $to);

// Response
http_response_code(200);
echo 'Moved';

?>