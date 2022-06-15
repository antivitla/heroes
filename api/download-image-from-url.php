<?php

include 'helper-save-file.php';

// Parse params
if (!$_REQUEST['url']) {
  http_response_code(400);
  throw new Error('"url" param required');
}

if (!$_REQUEST['saveTo']) {
  http_response_code(400);
  throw new Error('"saveTo" param required');
}

$url = $_REQUEST['url'];
$saveTo = '../' . $_REQUEST['saveTo'];

// Get image
$ch = curl_init();
curl_setopt_array($ch, array(
  CURLOPT_URL => $url,
  CURLOPT_HEADER => 0,
  CURLOPT_RETURNTRANSFER => 1,
  CURLOPT_BINARYTRANSFER => 1,
  CURLOPT_USERAGENT => 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0) Collector of Z Heroes'
));
$file = curl_exec($ch);
curl_close($ch);

// Save image
helperSaveFile($saveTo, $file);

// Response
http_response_code(200);
echo 'Done';

?>