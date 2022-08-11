import { useState } from "react";
import { useData } from "../../../registration-api/firebase";
import { StepTitle } from "../../common/FormLayout";

import { makeStyles } from "@mui/styles";
import { Box, TextField, Button, Card, Stack } from "@mui/material";

import * as Auth from "../../../../components/auth/auth";
import { registerNanosInFirebase } from "../../../registration-api/RegisterNanos";
import { ClassNames } from "@emotion/react";

const useStyles = makeStyles({
  container: {
    alignItems: "left",
    justifyContent: "flex-start",
    backgroundColor: "white",
    minHeight: "20vh",
    display: "flex",
    flexDirection: "column",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "left",
    padding: "0px 24px 20px 24px",
    marginTop: "13px",
    height: "100%",
    width: "50%",
    justifyContent: "space-evenly",
    "& .MuiTextField-root": { MimeTypeArray: 1, width: "100%" },
  },
  field: {
    // width: "50%",
  },
});

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 6.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// get nano list from firebase
const getNanoList = (nano) => {
  const listOfNano = Object.entries(nano).map(([nanoId, nanoObj]) => {
    return { ...(nanoObj as Record<string, any>), id: nanoId };
  });
  return listOfNano;
};

export default function NanoList() {
  const user = Auth.getUser();
  const classes = useStyles();
  const [nanoTags, setNanoTags] = useState([]);
  const [nanoList, nanoListLoading] = Object.values(
    useData("/nanoDevices", getNanoList)
  );
  const [beehive, setBeehive] = useState("");
  const [regKey, setRegKey] = useState(false);

  if (nanoListLoading) {
    return <h1 style={{ marginLeft: 20 }}>Loading...</h1>;
  }

  const handlePublish = async (e) => {
    // // get result from backend
    // fetch("http://localhost:5000/register")
    //   .then((res) => {
    //     if (res.statusText == "OK") {
    //       setRegKey(true);
    //       console.log("Reg key created succesfully!");
    //     }
    //   })
    //   .catch((err) => console.log(err));

    fetch("http://localhost:5000/register")
      .then((res) => res.blob())
      .then((data) => {
        var a = document.createElement("a");
        a.href = window.URL.createObjectURL(data);
        a.download = "registration.zip";
        a.click();
      });
  };

  return (
    <>
      <Card className={classes.container}>
        <Box
          className={classes.form}
          sx={{
            "& .MuiTextField-root": { m: 1, width: "25ch" },
          }}
        >
          <h2>Get Development Beehive Keys for Your Waggle Device</h2>
          <StepTitle icon="1" label="Enter Waggle Information" />
          <TextField
            id="uid"
            label="User ID"
            variant="outlined"
            defaultValue={user}
            className={classes.field}
          />
          <TextField
            id="nano-id"
            label="Nano ID"
            variant="outlined"
            className={classes.field}
          />

          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "center", margin: "16px" }}
          >
            <Button
              variant="outlined"
              color="error"
              type="submit"
              onClick={() => console.log("cancel")}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              id="publish-waggle"
              onClick={handlePublish}
            >
              Publish Waggle
            </Button>
          </Stack>
          {regKey && <h5>Check your download folder for registration keys!</h5>}
        </Box>
      </Card>
    </>
  );
}
