import React from "react";
import { Modal, IconButton, Box, Backdrop } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const Certificate = ({ ImgSertif }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Thumbnail */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
          transition: "transform 0.3s",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
          },
        }}
      >
        <img
          src={ImgSertif}
          alt="Certificate"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            objectFit: "cover",
          }}
          onClick={() => setOpen(true)}
        />
      </Box>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 300,
          sx: { backgroundColor: "rgba(0,0,0,0.9)" },
        }}
      >
        <Box
          sx={{
            position: "relative",
            maxWidth: "90vw",
            maxHeight: "90vh",
            margin: "auto",
            mt: 8,
          }}
        >
          <IconButton
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute",
              right: 16,
              top: 16,
              color: "white",
              bgcolor: "rgba(0,0,0,0.6)",
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={ImgSertif}
            alt="Certificate Full View"
            style={{
              maxWidth: "100%",
              maxHeight: "90vh",
              margin: "auto",
              display: "block",
            }}
          />
        </Box>
      </Modal>
    </Box>
  );
};

export default Certificate;