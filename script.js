const video = document.getElementById("video");
let myInterval = null;
let streaming = null;
let statusInsert = document.getElementsByClassName("face-memory").length > 0 ? true : false;
let statusGet = document.getElementsByClassName("face-scan").length > 0 ? true : false;
let statusDetectionScan = document.getElementsByClassName("face-scan").length > 0 ? true : false;
let faceDataFromDatabase = [];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
]).then(function () {
  startVideo();
});

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    function (stream) {
      video.srcObject = stream;
      streaming = stream;
    },
    (err) => alert(err)
  );
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  myInterval = setInterval(async () => {
    const minProbability = 0.05;
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability);
    const detectionsToDb = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();
    const obj = await saveFaceDataToMySQL(detectionsToDb);
    if (statusInsert) {
      await insertToDb(obj);
    }

    if (detectionsToDb.length > 0 && statusDetectionScan === true) {
      const returnStatus = await faceMatcher(detectionsToDb);
      if (!returnStatus) {
        statusGet = true;
      } else {
        statusDetectionScan = false;
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Found a face that matched data in the database.",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.timer) {
            location.reload();
          }
        });
      }
    }
  }, 100);
});

async function saveFaceDataToMySQL(detections) {
  return detections.map((detection) => {
    return {
      faceId: generateUniqueId(),
      landmarks: detection,
      timestamp: new Date().toISOString(),
      score: detection.detection.score,
    };
  });
}

async function insertToDb(obj) {
  if (obj.length > 0 && obj[0].score > 0.8) {
    $.ajax({
      url: "insert.php", //endpoint API
      type: "POST",
      data: {
        faceId: obj[0].faceId,
        timestamp: obj[0].timestamp,
        landmarks: JSON.stringify(obj[0].landmarks),
      },
      beforeSend: function () {
        statusInsert = false;
      },
      cache: false,
      dataType: "json",
      success: function (result) {
        if (result["status"] === "success") {
          Swal.fire({
            position: "center",
            icon: "success",
            title: "Your work has been saved",
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              statusInsert = true;
              location.href = 'index.html';
            }
          });
        }
      },
    });
  }
}

async function getFromDb() {
  return $.ajax({
    url: "get.php",
    type: "GET", //endpoint API
    beforeSend: function () {
      statusGet = false;
    },
    cache: false,
    dataType: "json",
  });
}

function stopStream(stream) {
  stream.getVideoTracks().forEach(function (track) {
    track.stop();
  });
}

async function faceMatcher(face_cam) {
  if (statusGet && faceDataFromDatabase.length <= 0) {
    faceDataFromDatabase = await getFromDb();
  } else {
    if (faceDataFromDatabase["status"] === "success" && faceDataFromDatabase["response"].length > 0) {
      if (face_cam[0].landmarks !== undefined) {
        for (let faceData of faceDataFromDatabase["response"]) {
          if (
            await landmarksMatches(
              face_cam[0].landmarks._positions,
              JSON.parse(faceData.landmarks).landmarks._positions
            )
          ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

async function landmarksMatches(landmarks1, landmarks2) {
  const threshold = 10;
  for (let i = 0; i < landmarks1.length; i++) {
    const point1 = landmarks1[i];
    const point2 = landmarks2[i];

    const distance = Math.sqrt(
      Math.pow(point1._x - point2._x, 2) + Math.pow(point1._y - point2._y, 2)
    );

    if (distance > threshold) {
      return false;
    }
  }

  return true;
}

function generateUniqueId() {
  return new Date().getTime() + Math.random();
}
