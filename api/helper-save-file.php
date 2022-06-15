<?php

function helperSaveFile ($saveTo, $data) {
  // Delete file, if present
  if(file_exists($saveTo)) {
    unlink($saveTo);
  }
  // Create folder, if needed
  $path = implode(array_slice(explode('/', $saveTo), 0, -1), '/');
  if (!file_exists($path)) {
    mkdir($path, 0777, true);
  }
  // Save file
  $fp = fopen($saveTo,'x');
  fwrite($fp, $data);
  fclose($fp);
}

?>
