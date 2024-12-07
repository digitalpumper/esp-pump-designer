import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Line } from "react-chartjs-2";

function ImageUploader() {
  const [image, setImage] = useState(null);
  const [digitizedData, setDigitizedData] = useState(null);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleProcessImage = async () => {
    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await axios.post("http://127.0.0.1:5000/api/digitize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDigitizedData(response.data);
    } catch (error) {
      console.error("Error digitizing image:", error);
    }
  };

  const renderGraph = () => {
    if (!digitizedData) return null;

    const data = {
      labels: digitizedData.x,
      datasets: [
        {
          label: "Horsepower",
          data: digitizedData.hp,
          borderColor: "red",
          fill: false,
        },
        {
          label: "Head",
          data: digitizedData.head,
          borderColor: "blue",
          fill: false,
        },
        {
          label: "Efficiency",
          data: digitizedData.efficiency,
          borderColor: "green",
          fill: false,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Digitized Pump Curve" },
      },
    };

    return <Line data={data} options={options} />;
  };

  return (
    <div style={{ padding: "20px" }}>
      <div {...getRootProps()} style={{ border: "1px dashed gray", padding: "20px", marginBottom: "20px" }}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop an image here, or click to select one</p>
        {image && <img src={image} alt="Uploaded" style={{ maxWidth: "100%" }} />}
      </div>
      <button onClick={handleProcessImage} style={{ marginBottom: "20px" }}>
        Process Image
      </button>
      {renderGraph()}
    </div>
  );
}

export default ImageUploader;
