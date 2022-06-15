<?php

header('Content-Type: application/json');

if ($_REQUEST['page']) {
  $page = $_REQUEST['page'];
  $url = 'https://warheroes.ru/main.asp/page/'. $page . '/filter/get';
} else {
  $url = 'https://warheroes.ru/main.asp/filter/get/';
}

if ($_REQUEST['fromDate']) {
  $fromDate = $_REQUEST['fromDate'];
} else {
  $fromDate = '20.02.2022';
}

if ($_REQUEST['byDeath']) {
  $byDeath = $_REQUEST['byDeath'];
} else {
  $byDeath = 'false';
}

var_dump($byDeath);

if ($byDeath == 'true') {
  $postFields = 'birthday=&birthday1=&deathday=' . $fromDate . '&deathday1=&dateNagrFrom=&dateNagrTo=&war=0&star=0&alpha=0&death=0&sortBy=onlyFIO&submit=%D0%9F%D0%BE%D0%B8%D1%81%D0%BA&limit=150';
} else {
  $postFields = 'birthday=&birthday1=&deathday=&deathday1=&dateNagrFrom=' . $fromDate . '&dateNagrTo=&war=0&star=0&alpha=0&death=0&sortBy=onlyFIO&submit=%D0%9F%D0%BE%D0%B8%D1%81%D0%BA&limit=150';
}

// Search
$ch = curl_init();
curl_setopt_array($ch, array(
  CURLOPT_URL => $url,
  CURLOPT_POST => 1,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POSTFIELDS => $postFields,
  CURLOPT_ENCODING => 'UTF-8',
  CURLOPT_USERAGENT => 'Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0) Collector Z Heroes'
));
$data = curl_exec($ch);
curl_close($ch);

// Response
http_response_code(200);
echo $data;

?>