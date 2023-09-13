<?php
require "./config/database.php";

$database = new Database("localhost", "face_scan", "root", "", 3306);

$conn = $database->connection();

$arr = array();
$arr["status"] = "fail";

$face_id = isset($_POST['faceId']) ? $_POST['faceId'] : "";
$timestamp = isset($_POST['timestamp']) ? $_POST['timestamp'] : "";
$landmarks = isset($_POST['landmarks']) ? json_encode($_POST['landmarks'], true) : "";
$ref_person = isset($_POST['ref_person']) ? strtolower($_POST['ref_person']) : "";

if (!empty($face_id) && !empty($timestamp) && !empty($landmarks) && !empty($ref_person)) {
    try {
        $query = "INSERT INTO face_detail (face_id, landmarks, ref_person) VALUES (:face_id, :landmarks, :ref_person)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":face_id", $face_id);
        $stmt->bindParam(":landmarks", $landmarks);
        $stmt->bindParam(":ref_person", $ref_person);
        $stmt->execute();
        if ($stmt) {
            $arr["status"] = "success";
            echo json_encode($arr);
        }
    } catch (PDOException $e) {
        echo json_encode($e);
    }
}

exit();
