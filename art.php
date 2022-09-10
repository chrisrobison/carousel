<?php
    $artist = escapeshellarg($_REQUEST['q']);
    $album = "";
    if (array_key_exists('l', $_REQUEST)) {
        $album = '--album "'.escapeshellarg($_REQUEST['l']).'"';
    }
    $key = $artist . $album;
    $url = `/usr/local/bin/album-art "{$artist}" $album`;
    $file = base64_encode($url) . '.jpg';

    if (!file_exists("cache/$file")) {
        $result = `curl -o cache/$file $url`;
        print $result;
    }

    $url = "https://www.autonomicnow.com/cache/$file";
    header("Location: $url");
?>
