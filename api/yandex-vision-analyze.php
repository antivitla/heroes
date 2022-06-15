<?php

// header('Content-Type: application/json');

// Get recognition
$ch = curl_init();
$credentials = json_decode(file_get_contents("../credentials.json"), true);
curl_setopt_array($ch, array(
  CURLOPT_URL => 'https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze',
  CURLOPT_POST => 1,
  CURLOPT_CONNECTTIMEOUT => 2000000,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POSTFIELDS => file_get_contents('php://input'),
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/json',
    'Authorization: Bearer ' . $credentials['yandex.vision']['iam.token']
  )
));
$data = curl_exec($ch);
curl_close($ch);

// Response
http_response_code(200);
echo $data;

?>