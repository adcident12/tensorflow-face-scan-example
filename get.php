<?php
require "./config/database.php";

$database = new Database("localhost", "face_scan", "root", "", 3306);

$conn = $database->connection();

$arr = array();
$arr["status"] = "fail";
$arr["response"] = [];

$tmp = [];

try {
    $query = "SELECT * FROM face_detail";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    if ($stmt) {
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $tmp['face_id'] = $row['face_id'];
            $tmp['id'] = $row['id'];
            $tmp['landmarks'] = json_decode($row['landmarks']);
            $tmp['timestamp'] = $row['timestamp'];
            array_push($arr["response"], $tmp);
        }
        $arr["status"] = "success";
        echo json_encode($arr);
    }
} catch (PDOException $e) {
    echo json_encode($e);
}

exit();
