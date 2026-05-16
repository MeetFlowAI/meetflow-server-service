import express from "express";

const app = express();

const PORT = 5000;

app.get("/", (req, res) => {
  res.json({
    message: "MeetFlow API Running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
