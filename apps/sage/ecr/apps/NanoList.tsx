import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useMatch, Navigate } from "react-router-dom";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useData } from "../utilities/firebase";
import { StepTitle, Step, StepForm } from "../../common/FormLayout";
import CountDownTimer from "./CountDownTimer"

import { makeStyles } from "@mui/styles";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  OutlinedInput,
  Chip,
  MenuItem,
  Card,
  CardHeader,
  Stack,
} from "@mui/material";

import BeeIcon from "url:/assets/bee.svg";
import ErrorMsg from "../../ErrorMsg";
import * as Auth from "/components/auth/auth";
import { registerNanosInFirebase } from "../utilities/RegisterNanos";
import RegistrationKeyLists from "./ApiFunctions";
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
  const [hardware, setHardware] = useState("");
  const [registrationKey, setRegistrationKey] = useState(false);
  const hoursMinSecs = {hours:0, minutes: 0, seconds: 5}

  if (nanoListLoading) {
    return <h1 style={{ marginLeft: 20 }}>Loading...</h1>;
  }

  console.log(nanoList);

  const handleNanoTagsChange = (event) => {
    const {
      target: { value },
    } = event;
    setNanoTags(typeof value === "string" ? value.split(",") : value);
  };

  const handleRegister = async () => {
    const nanoId = registerNanosInFirebase({
      RegisteredNanos: nanoTags,
    });

    setNanoTags([]);
  };

  const handlePublish = () => {
    setRegistrationKey(true);
  };

  const handleCancelPublish = () => {
    console.log(registrationKey)
    setRegistrationKey(false);
  };

  const handleChange = (event: SelectChangeEvent) => {
    setHardware(event.target.value);
  };

  return (
    <>
      <Card className={classes.container} sx={{ mb: 3 }}>
        <Box className={classes.form}>
          <h1>Register Your Nano Devices</h1>
          <FormControl sx={{ my: 1, width: "100%" }}>
            <InputLabel sx={{ fontSize: "14px" }}>Nanos</InputLabel>
            <Select
              className={classes.field}
              multiple
              value={nanoTags}
              onChange={handleNanoTagsChange}
              input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
              MenuProps={MenuProps}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {nanoList?.map((tags) => (
                <MenuItem
                  sx={{
                    fontSize: "14px",
                    "&.Mui-selected": {
                      // <-- mixing the two classes
                      backgroundColor: "#ececec",
                    },
                    "&.Mui-selected:hover": {
                      // <-- mixing the two classes
                      backgroundColor: "#ececec",
                    },
                  }}
                  key={tags.id}
                  value={tags.id}
                >
                  {tags.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            variant="contained"
            type="submit"
            onClick={() => {
              if (nanoTags.length > 0) handleRegister();
            }}
            sx={{ mb: "13px" }}
          >
            Register
          </Button>
        </Box>
      </Card>

      <Card className={classes.container}>
        <Box
          className={classes.form}
          sx={{
            "& .MuiTextField-root": { m: 1, width: "25ch" },
          }}
        >
          <h1>Publish Your Nano Device</h1>
          <StepTitle icon="1" label="Enter Nano Information" />

          <TextField
            id="uid"
            label="User ID"
            variant="outlined"
            defaultValue={user}
            className={classes.field}
          />
          <FormControl sx={{ m: 1, width: "100%" }}>
            <InputLabel id="hardware">Hardware</InputLabel>
            <Select value={hardware} label="Hardware" onChange={handleChange}>
              <MenuItem value="Nano">Nano</MenuItem>
              <MenuItem value="RPI">Raspberrypi</MenuItem>
            </Select>
          </FormControl>

          <TextField
            id="nano-id"
            label="Nano ID"
            variant="outlined"
            className={classes.field}
          />
          <TextField
            id="location"
            label="Location"
            variant="outlined"
            className={classes.field}
          />
          <TextField
            id="register-date"
            label="Date"
            variant="outlined"
            defaultValue={Date()}
            className={classes.field}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", m: 2 }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              type="submit"
              onClick={() => handlePublish()}
            >
              Publish Nano
            </Button>
            <Button
              variant="outlined"
              color="error"
              type="submit"
              onClick={() => handleCancelPublish()}
            >
              Cancel
            </Button>
          </Stack>
        </Box>

        <Box className={classes.form}>
        <div>
            <CountDownTimer hoursMinSecs={hoursMinSecs}/>
        </div>

        {registrationKey? <RegistrationKeyLists/> : <></>}
        </Box>

      </Card>
    </>
  );
}
