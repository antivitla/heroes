<?php

include 'helper-save-file.php';

// // Setup CORS headers
// header("Access-Control-Allow-Origin: *");
// header("Access-Control-Allow-Headers: *");

// Parse params
if (!$_REQUEST['url']) {
  http_response_code(400);
  throw new Error('"url" param required');
}

$url = $_REQUEST['url'];
if ($_REQUEST['saveTo']) {
  $saveTo = '../' . $_REQUEST['saveTo'];
}

$referer = $_REQUEST['referer'];
if (!$referer) {
  $parsedUrl = parse_url($url);
  $referer = $parsedUrl['host'];
}

// Get document
$ch = curl_init();
curl_setopt_array($ch, array(
  CURLOPT_URL => $url,
  CURLOPT_RETURNTRANSFER => 1,
  CURLOPT_FOLLOWLOCATION => 1,
  CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
  CURLOPT_CONNECTTIMEOUT => 40000,
  CURLOPT_ENCODING => 'UTF-8',
  CURLOPT_REFERER => $referer,
  CURLOPT_USERAGENT => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.143 YaBrowser/22.5.0.1885 Yowser/2.5 Safari/537.36  Collector of Z Heroes'
));
$data = curl_exec($ch);
if( !$data) {
  var_dump(curl_error($ch));
}
curl_close($ch);

// Save document, if needed
if (isset($saveTo)) {
  helperSaveFile($saveTo, $data);
}

if ($_REQUEST['charset']) {
  $data = iconv($_REQUEST['charset'] . '//IGNORE', 'UTF-8//IGNORE', $data);
}

// Response
http_response_code(200);
echo $data;

?>