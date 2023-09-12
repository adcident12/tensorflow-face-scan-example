<?php

class Database
{

    private $host;
    private $databaseName;
    private $username;
    private $password;
    private $port;

    public $conn;

    public function __construct($host, $databaseName, $username, $password, $port)
    {
        $this->host = $host;
        $this->databaseName = $databaseName;
        $this->username = $username;
        $this->password = $password;
        $this->port = $port;
    }

    public function connection()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";
                port=" . $this->port . ";
                dbname=" . $this->databaseName,
                $this->username,
                $this->password
            );
            $this->conn->exec("SET NAMES 'utf8'");
        } catch (PDOException $e) {
            $this->conn = "Database could not be connection" . $e->getMessage();
        }

        return $this->conn;
    }
}
