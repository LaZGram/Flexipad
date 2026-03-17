import React, { useState, useEffect, useRef } from "react"; // Import necessary React hooks
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Module,
  Modal,
  ScrollView,
} from "react-native"; // Import React Native components
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import tw from "twrnc";
import FullResult from "../result";

import { RouteProp, useRoute } from "@react-navigation/native"; // Import navigation hooks
import { useBleManager } from "../../components/context/blecontext"; // Import custom BLE manager context
import { CHARACTERISTIC } from "@/enum/characteristic"; // Import BLE characteristics enumeration
import { RoundPadData } from "@/components/mode/types";

// import { Result } from "@/app/(tabs)/result";
import ShowPad from "../running";
import { Device } from "react-native-ble-plx";
import { light } from "@eva-design/eva";
import index from "..";

const StartGame = () => {
  const router = useRouter();
  
  // Destructure positions from the IconPosition context
  // const { positions } = useIconPosition();

  // State to track the currently active pad index; -1 means no active pad
  const [activePadIndex, setActivePadIndex] = useState(-1);

  // time
  const startTimeRef = useRef<number | null>(null);
  const gameEndTimeRef = useRef<number | null>(null);
  const firstLightTimeRef = useRef<number | null>(null); // Track when first light appears

  // start stop game
  const stopGameRef = useRef<boolean>(false);

  //
  const activePadIndexRef = useRef<number>(activePadIndex);
  // setActivePadIndex(-1);
  // State to track if the game is currently playing
  const [reaction_time, setReaction_time] = useState<number[]>([]);
  const [result_reactionTime, setResult_reactionTime] = useState<number[]>([]);
  const reactionTimeRef = useRef<number[]>([]); // Ref to track reaction times immediately
  const [missCount, setMissCount] = useState(0);
  const missCountRef = useRef(0);
  const [isHit, setIshit] = useState(1);
  const isHitRef = useRef(isHit);
  const isHitObjRef = useRef([1, 1, 1, 1, 1, 1, 1, 1, 1]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowresult] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [averageReactionTime, setaverageReactionTime] = useState(-1);
  const [showConfigModal, setShowConfigModal] = useState(false);
  // const [forceStop, setForceStop] = useState(true);
  const forceStopRef = useRef(true);
  useEffect(() => {
    reactionTimeRef.current = reaction_time;
  }, [reaction_time]);
  
  function calculateAverageReactionTime(times: number[]): number {
    // Filter out misses (marked as -1)
    const validTimes = times.filter(t => t >= 0);
    if (validTimes.length > 0) {
      const sum = validTimes.reduce((acc, val) => acc + val, 0);
      const average = sum / validTimes.length;
      return average / 1000; // Convert to seconds
    }
    return 0; // Return 0 if no valid times
  }
  // Ref to store the interval ID for hit detection to allow clearing it later
  const hitDetectionIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to store the interval ID for pad activation to allow clearing it later
  const padActivationIntervalIdRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to keep track of the latest hit count to avoid stale closures
  const hitCountRef = useRef(0);

  // function blink
  const blink = async (device: Device) => {
    try {
      let redLight = true;
      const redColor = "/wAB";
      const blueColor = "AAD/";
      for (let i = 0; i < 10; i++) {
        await writeCharacteristic(
          device,
          CHARACTERISTIC.LED,
          redLight ? redColor : blueColor
        );
        redLight = !redLight;
        await new Promise((resolve) => setTimeout(resolve, 300)); // เพิ่มระยะเวลาที่เหมาะสม
      }
      // ปิดไฟ LED หลังจากกระพริบเสร็จ
      await writeCharacteristic(device, CHARACTERISTIC.LED, "AAAA");
    } catch (error) {
    }
  };

  // Ref to keep track of the latest isPlaying state
  const isPlayingRef = useRef(isPlaying);
  // Example positions data for pads
  const positions = [
    { x: 50, y: 100 },
    { x: 150, y: 200 },
    { x: 250, y: 300 },
  ];

  // Update isPlayingRef whenever isPlaying state changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Destructure BLE manager functions and connected devices from the context
  const {
    connectedDevice,
    writeCharacteristic,
    monitorCharacteristic,
    monitorCharacteristicRef,
  } = useBleManager();
  let gameEndTime: number;

  // Define the type for route parameters received from the training page
  type StartScreenParams = {
    lightOut: string;
    hitCount: number;
    timeout: number;
    lightDelay: string;
    delaytime: number;
    duration: string;
    hitduration: number;
    minDuration: number;
    secDuration: number;
    roundPads?: RoundPadData[];
  };

  // Retrieve the route and its parameters using the useRoute hook
  const route = useRoute<RouteProp<{ start: StartScreenParams }, "start">>();
  const [pressButton, setPressButton] = useState(false);

  // Destructure parameters with default values in case they are undefined
  let {
    lightOut = null,
    hitCount = 0,
    timeout = 0,
    lightDelay = null,
    delaytime = -1,
    duration = null,
    hitduration = 0,
    minDuration = 0,
    secDuration = 0,
    roundPads = undefined,
  } = route.params || {};
  // Example positions data for pads

  // State to track the number of hits by the user
  const [userHitCount, setUserHitCount] = useState(0);

  // Update hitCountRef whenever userHitCount state changes
  useEffect(() => {
    hitCountRef.current = userHitCount;
  }, [userHitCount]);

  const isHitMode = lightOut === "Hit" || lightOut === "Hit or Timeout";
  const isTimeMode = lightOut === "Timeout" || lightOut === "Hit or Timeout";
  const isHitModeDur = duration === "Hit" || duration === "Hit or Timeout";
  const isTimeModeDur = duration === "Timeout" || duration === "Hit or Timeout";

  const handleCloseResult = () => setShowresult(false);
  //_______________________________________________________________________________________game play function
  const activateRandomPad = (activepad: number, currentRound?: number) => {
    // If roundPads is configured and we have a round number, use the specified pad
    if (roundPads && currentRound !== undefined) {
      const roundConfig = roundPads.find(rp => rp.round === currentRound);
      if (roundConfig) {
        // Convert from 1-based pad number to 0-based index
        const padIndex = roundConfig.pad - 1;
        return padIndex;
      }
    }
    
    // Otherwise, use random selection (original behavior)
    const connectedPads = connectedDevice.filter((device) => device !== null);
    const totalPads = connectedPads.length;
    let randomIndex = Math.floor(Math.random() * totalPads);
    if (totalPads === 1) {
      return activepad;
    }
    while (activepad === randomIndex) {
      randomIndex = Math.floor(Math.random() * totalPads);
    }
    return randomIndex;
  };

  const randomTime = () => {
    // Return a random number between 0.5 and 5
    return Math.random() * 4.5 + 0.5;
  };

  // Monitor all pads for wrong pad presses
  const monitorWrongPadPress = (correctPadIndex: number, cancelSignal: {cancelled: boolean}) => {
    const wrongPadPromises = connectedDevice
      .filter((device, index) => device !== null && index !== correctPadIndex)
      .map((device, deviceIndex) => {
        // Get actual index from connected devices
        const actualIndex = connectedDevice.findIndex((d, i) => d === device && i !== correctPadIndex);
        return device.waitForButtonToBeTrue().then(() => {
          // Check if we should ignore this wrong pad press (correct pad was already pressed)
          if (cancelSignal.cancelled) {
            return new Promise(() => {}); // Never resolve
          }
          // Don't increment miss count here - let the caller handle it
          return `wrong-pad-${actualIndex}`;
        });
      });
    
    return Promise.race(wrongPadPromises);
  };

  const play_hit = async (hitCount: number) => {
    const timeout = (minDuration * 60 + secDuration) * 1000; // Game duration in milliseconds
    const startTime = Date.now(); // Record start time

    let activepad = 0;

    // "Timeout" or "Hit or Timeout" case
    while (
      (duration === "Timeout" || duration === "Hit or Timeout") &&
      timeout - (Date.now() - startTime) > 0
    ) {
      if (forceStopRef.current) {
        return; // Exit the function immediately
      }

      const remainingTime = timeout - (Date.now() - startTime);
      if (remainingTime <= 0) {
        break;
      }

      if (lightDelay === "Random") {
        delaytime = randomTime();
      }

      try {
        const index = activateRandomPad(activepad, hitCount + 1);
        activepad = index;
        setActivePadIndex(index);

        if (hitCount >= hitduration && duration === "Hit or Timeout") {
          break;
        }
        
        await writeCharacteristic(
          connectedDevice[index].device,
          CHARACTERISTIC.LED,
          "AP8A"
        // Set first light time for accurate playTime calculation
        if (firstLightTimeRef.current === null) {
          firstLightTimeRef.current = padTurnon;
        }

        // Wait for button press or timeout while checking for force stop
        const cancelSignal = {cancelled: false};
        const buttonPressPromise =
          connectedDevice[index].waitForButtonToBeTrue().then(() => {
            cancelSignal.cancelled = true; // Cancel wrong pad monitoring
            return "correct";
          });
        const wrongPadPromise = monitorWrongPadPress(index, cancelSignal);
        const forceStopCheckPromise = new Promise((_, reject) => {
          const interval = setInterval(() => {
            if (forceStopRef.current) {
              clearInterval(interval);
              reject(new Error("Force stop triggered"));
            }
          }, 100); // Check every 100ms
        });

        const TimeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject("Timeout"),
            timeout - (Date.now() - startTime)
          )
        );

        const result = await Promise.race([
          buttonPressPromise,
          wrongPadPromise,
          forceStopCheckPromise,
          TimeoutPromise,
        ]);

        // If wrong pad was pressed, continue waiting for correct pad or timeout
        if (typeof result === "string" && result.startsWith("wrong-pad")) {
          // Increment miss count for wrong pad press
          missCountRef.current++;
          setMissCount(missCountRef.current);
          // Don't increment hitCount, just continue the loop
          setActivePadIndex(-1);
          await writeCharacteristic(
            connectedDevice[index].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
          await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
          continue;
        }

        // Turn off the pad's LED
        setActivePadIndex(-1);
        const padTurnoff = Date.now();
        const reactionTime = (padTurnoff - padTurnon) / 1000;
        
        // Update ref immediately and state
        reactionTimeRef.current = [...reactionTimeRef.current, reactionTime];
        setReaction_time([...reactionTimeRef.current]);
        
        await writeCharacteristic(
          connectedDevice[index].device,
          CHARACTERISTIC.LED,
          "AAAA"
        );
        
        // Delay for the specified `delaytime`
        await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));

        // Increment hit count
        hitCount++;
        setUserHitCount(hitCount);
      } catch (error) {
        if (error.message === "Force stop triggered") {
          return; // Exit the function immediately
        }
        if (error === "Timeout") {
          
        }
      }
    }

    // "Hit" case
    while (duration === "Hit" && hitCount < hitduration) {
      if (forceStopRef.current) {
        return; // Exit the function immediately
      }

      if (lightDelay === "Random") {
        delaytime = randomTime();
      }

      try {
        const index = activateRandomPad(activepad, hitCount + 1);
        activepad = index;
        setActivePadIndex(index);
        
        await writeCharacteristic(
          connectedDevice[index].device,
          CHARACTERISTIC.LED,
          "AP8A"
        );
        const padTurnon = Date.now(); // Record time AFTER LED is on
        // Set first light time for accurate playTime calculation
        if (firstLightTimeRef.current === null) {
          firstLightTimeRef.current = padTurnon;
        }

        // Wait for button press or force stop
        const cancelSignal = {cancelled: false};
        const buttonPressPromise =
          connectedDevice[index].waitForButtonToBeTrue().then(() => {
            cancelSignal.cancelled = true; // Cancel wrong pad monitoring
            return "correct";
          });
        const wrongPadPromise = monitorWrongPadPress(index, cancelSignal);
        const forceStopCheckPromise = new Promise((_, reject) => {
          const interval = setInterval(() => {
            if (forceStopRef.current) {
              clearInterval(interval);
              reject(new Error("Force stop triggered"));
            }
          }, 100); // Check every 100ms
        });

        const result = await Promise.race([
          buttonPressPromise,
          wrongPadPromise,
          forceStopCheckPromise
        ]);

        // If wrong pad was pressed, continue waiting
        if (typeof result === "string" && result.startsWith("wrong-pad")) {
          // Increment miss count for wrong pad press
          missCountRef.current++;
          setMissCount(missCountRef.current);
          setActivePadIndex(-1);
          await writeCharacteristic(
            connectedDevice[index].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
          await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
          continue;
        }

        hitCount++;
        setUserHitCount(hitCount);

        // Turn off the pad's LED
        const padTurnoff = Date.now();
        const reactionTime = (padTurnoff - padTurnon) / 1000;
        
        // Update ref immediately and state
        reactionTimeRef.current = [...reactionTimeRef.current, reactionTime];
        setReaction_time([...reactionTimeRef.current]);
        setActivePadIndex(-1);
        
        await writeCharacteristic(
          connectedDevice[index].device,
          CHARACTERISTIC.LED,
          "AAAA"
        );

        await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
      } catch (error) {
        if (error.message === "Force stop triggered") {
          return; // Exit the function immediately
        }
        if (error === "Timeout") {
        }
      }
    }

    // Turn off the light when the game ends
    setActivePadIndex(-1);
    if (connectedDevice[activepad]?.device) {
      await writeCharacteristic(
        connectedDevice[activepad].device,
        CHARACTERISTIC.LED,
        "AAAA"
      );
    }
  };

  const play_timeout = async (hitCount: number, interval: number) => {
    const timeout = (minDuration * 60 + secDuration) * 1000; // Game duration in milliseconds
    const startTime = Date.now(); // Record start time
    let padTurnon = Date.now();
    let activepad = 0;

    // Helper function to check forceStop
    const checkForceStop = () => {
      if (forceStopRef.current) {
        throw new Error("ForceStop");
      }
    };

    // Main game loop for "Timeout" or "Hit or Timeout"
    while (
      (duration === "Timeout" || duration === "Hit or Timeout") &&
      Date.now() - startTime < timeout
    ) {
      checkForceStop(); // Check forceStop before doing anything
      if (lightDelay === "Random") {
        delaytime = randomTime();
      }
      const index = activateRandomPad(activepad, hitCount + 1);
      activepad = index;
      setActivePadIndex(index);
      try {
        if (hitCount >= hitduration && duration === "Hit or Timeout") break;
        // Turn on the pad's LED
        setActivePadIndex(index);
        await writeCharacteristic(
          connectedDevice[index].device,
          CHARACTERISTIC.LED,
          "AP8A"
        );
        const padTurnon = Date.now(); // Record time AFTER LED is on

        // Wait for button release, game timeout, interval timeout, or forceStop
        await Promise.race([
          connectedDevice[index].waitForButtonToBeFalse(), // Button release
          new Promise((_, reject) =>
            setTimeout(
              () => reject("Timeout"),
              timeout - (Date.now() - startTime)
            )
          ), // Game timeout
          new Promise((_, reject) =>
            setTimeout(() => reject("Interval Timeout"), interval)
          ), // Interval timeout
          new Promise((_, reject) => {
            const intervalId = setInterval(() => {
              if (forceStopRef.current) {
                clearInterval(intervalId);
                reject("ForceStop");
              }
            }, 100);
          }),
        ]);
        hitCount++;
        setUserHitCount(hitCount);

        // Turn off the pad's LED after successful interaction
        setActivePadIndex(-1);
        const padTurnoff = Date.now();
        const reactionTime = (padTurnoff - padTurnon) / 1000;
        
        // Update ref immediately and state
        reactionTimeRef.current = [...reactionTimeRef.current, reactionTime];
        setReaction_time([...reactionTimeRef.current]);
        
        await writeCharacteristic(
          connectedDevice[activepad].device,
          CHARACTERISTIC.LED,
          "AAAA"
        );

        // Delay for the specified `delaytime`
        await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
      } catch (error) {
        if (error === "Timeout") {
          break; // Exit the loop if total game timeout is reached
        } else if (error === "Interval Timeout") {
          missCountRef.current++;
          setMissCount(missCountRef.current);
          const padTurnoff = Date.now();
          const timeoutDuration = (padTurnoff - padTurnon) / 1000;
          // Store the timeout duration as negative to mark it as a miss but keep the time
          reactionTimeRef.current = [...reactionTimeRef.current, -timeoutDuration];
          setReaction_time([...reactionTimeRef.current]);
          await writeCharacteristic(
            connectedDevice[index].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );

          await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
        } else if (error === "ForceStop") {
          break; // Exit the loop immediately if forceStop is triggered
        } else {
          
        }
      }
    }

    // Similar implementation for "Hit" duration
    while (duration === "Hit" && hitCount < hitduration) {
      checkForceStop();
      try {
        if (lightDelay === "Random") {
          delaytime = randomTime();
        }
        const index = activateRandomPad(activepad, hitCount + 1);
        activepad = index;
        setActivePadIndex(index);
        await writeCharacteristic(
          connectedDevice[index].device,
          CHARACTERISTIC.LED,
          "AP8A"
        );
        const padTurnon = Date.now(); // Record time AFTER LED is on

        const result = await Promise.race([
          connectedDevice[index]
            .waitForButtonToBeFalse()
            .then(() => "Button Pressed"),
          new Promise((_, reject) =>
            setTimeout(() => reject("Interval Timeout"), interval)
          ).catch(() => "Interval Timeout"),
          new Promise((_, reject) => {
            const intervalId = setInterval(() => {
              if (forceStopRef.current) {
                clearInterval(intervalId);
                reject("ForceStop");
              }
            }, 100);
          }),
        ]);

        if (result === "Button Pressed") {
          hitCount++;
          setUserHitCount(hitCount);
          setActivePadIndex(-1);
          const padTurnoff = Date.now();
          const reactionTime = (padTurnoff - padTurnon) / 1000;
          
          // Update ref immediately and state
          reactionTimeRef.current = [...reactionTimeRef.current, reactionTime];
          setReaction_time([...reactionTimeRef.current]);
          
          await writeCharacteristic(
            connectedDevice[index].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
        } else if (result === "Interval Timeout") {
          missCountRef.current++;
          setMissCount(missCountRef.current);
          setActivePadIndex(-1);
          const padTurnoff = Date.now();
          const timeoutDuration = (padTurnoff - padTurnon) / 1000;
          // Store the timeout duration as negative to mark it as a miss but keep the time
          reactionTimeRef.current = [...reactionTimeRef.current, -timeoutDuration];
          setReaction_time([...reactionTimeRef.current]);
          await writeCharacteristic(
            connectedDevice[index].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
      } catch (error) {
        if (error === "ForceStop") {
          break;
        }
      }
    }
    if (forceStopRef.current) {
      return;
    }
    setActivePadIndex(-1);
    if (connectedDevice[activepad]?.device) {
      setActivePadIndex(-1);
      await writeCharacteristic(
        connectedDevice[activepad].device,
        CHARACTERISTIC.LED,
        "AAAA"
      );
    }
  };

  const play_hitOrTimeout = async (hitCounts: number, interval: number) => {
    const colorDict = {
      1: "/wAB", // Red (#FF0000)
      2: "/wAg", // Green (#00FF00)
      3: "AA/A", // Blue (#0000FF)
      4: "/wDg", // Yellow (#FFFF00)
      5: "9vAM", // Purple (#800080)
      6: "AP8A", // Teal (#008080)
      7: "+/8A", // Orange (#FFA500)
      8: "wDwA", // Dark Gray-Blue (#2C3E50)
      9: "/wDw", // Light Green (#32CD32)
      10: "+/wA", // Crimson (#DC143C)
    };

    const timeout = (minDuration * 60 + secDuration) * 1000; // Total game duration in milliseconds
    const startTime = Date.now(); // Start time of the game
    let activepad = 0; // Track the active pad
    let currentHitCounts: number = 0; // Initialize the current hit count
    let isstuck = false;
    const checkForceStop = () => {
      if (forceStopRef.current) {
        throw new Error("ForceStop");
      }
    };

    while (
      duration === "Hit" &&
      hitCounts < hitduration // Continue while time remains and hit count is not met
    ) {
      checkForceStop(); // Check forceStop before doing anything
      if (lightDelay === "Random") {
        delaytime = randomTime();
      }

      try {
        // Activate a random pad
        if (!isstuck || activepad < 0) {
          const index = activateRandomPad(activepad, currentHitCounts + 1);
          activepad = index;
          setActivePadIndex(index);
        }

        // Turn on the pad's LED
        await writeCharacteristic(
          connectedDevice[activepad].device,
          CHARACTERISTIC.LED,
          colorDict[currentHitCounts + 1]
        );
        const padTurnon = Date.now(); // Record time AFTER LED is on

        // Wait for button press, wrong pad press, interval timeout, or game timeout
        const cancelSignal = {cancelled: false};
        const correctPadPromise = connectedDevice[activepad].waitForButtonToBeFalse().then(() => {
          cancelSignal.cancelled = true; // Cancel wrong pad monitoring
          return "Hit";
        });
        const wrongPadPromise = monitorWrongPadPress(activepad, cancelSignal);
        const result = await Promise.race([
          correctPadPromise, // Button release
          wrongPadPromise,
          new Promise(
            (_, reject) =>
              setTimeout(() => reject("Interval Timeout"), interval) // Interval timeout
          ),
          new Promise((_, reject) => {
            const intervalId = setInterval(() => {
              if (forceStopRef.current) {
                clearInterval(intervalId);
                reject("ForceStop");
              }
            }, 100);
          }),
        ]);

        // If wrong pad was pressed, reset progress
        if (typeof result === "string" && result.startsWith("wrong-pad")) {
          // Increment miss count for wrong pad press
          missCountRef.current++;
          setMissCount(missCountRef.current);
          currentHitCounts = 0;
          isstuck = false;
          setActivePadIndex(-1);
          await writeCharacteristic(
            connectedDevice[activepad].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
          await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
          continue;
        }

        // Turn off the pad's LED
        if (result === "Hit") {
          currentHitCounts++;
          hitCounts++;
          setUserHitCount(hitCounts);
          isstuck = true;

          if (currentHitCounts >= hitCount) {
            isstuck = false;
            currentHitCounts = 0;
            setActivePadIndex(-1);
            const padTurnoff = Date.now();
            const reactionTime = (padTurnoff - padTurnon) / 1000;
            
            // Update ref immediately and state
            reactionTimeRef.current = [...reactionTimeRef.current, reactionTime];
            setReaction_time([...reactionTimeRef.current]);
            
            await writeCharacteristic(
              connectedDevice[activepad].device,
              CHARACTERISTIC.LED,
              "AAAA"
            );

            // Delay before activating the next pad
            await new Promise((resolve) =>
              setTimeout(resolve, delaytime * 1000)
            );
          }
        }
      } catch (error) {
        if (error === "Interval Timeout") {
          isstuck = false;
          missCountRef.current++;
          setMissCount(missCountRef.current);
          currentHitCounts = 0;
          setActivePadIndex(-1);
          await writeCharacteristic(
            connectedDevice[activepad].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
          await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
        } else if (error === "ForceStop") {
          break; // Exit the loop immediately if forceStop is triggered
        } else {
        }

        // Ensure the pad's LED is turned off in case of an error
        setActivePadIndex(-1);
        if (activepad >= 0) {
          await writeCharacteristic(
            connectedDevice[activepad].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
        }
        if (forceStopRef.current) {
          return;
        }

        // Delay before activating the next pad
        await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
      }
    }

    while (
      (duration === "Timeout" || duration === "Hit or Timeout") &&
      Date.now() - startTime < timeout
      // Continue while time remains and hit count is not met
    ) {
      checkForceStop(); // Check forceStop before doing anything
      if (lightDelay === "Random") {
        delaytime = randomTime();
      }
      if (duration === "Hit or Timeout" && hitCounts >= hitduration) break;

      try {
        // Activate a random pad
        if (!isstuck || activepad < 0) {
          const index = activateRandomPad(activepad, currentHitCounts + 1);
          activepad = index;
          setActivePadIndex(index);
        }

        // Turn on the pad's LED
        await writeCharacteristic(
          connectedDevice[activepad].device,
          CHARACTERISTIC.LED,
          colorDict[currentHitCounts + 1]
        );
        const padTurnon = Date.now(); // Record time AFTER LED is on

        // Wait for button press, wrong pad press, interval timeout, or game timeout
        const cancelSignal = {cancelled: false};
        const correctPadPromise = connectedDevice[activepad].waitForButtonToBeFalse().then(() => {
          cancelSignal.cancelled = true; // Cancel wrong pad monitoring
          return "Hit";
        });
        const wrongPadPromise = monitorWrongPadPress(activepad, cancelSignal);
        const result = await Promise.race([
          correctPadPromise,
          wrongPadPromise,
          new Promise(
            (_, reject) =>
              setTimeout(
                () => reject("Timeout"),
                timeout - (Date.now() - startTime)
              ) // Game timeout
          ),
          new Promise((_, reject) =>
            setTimeout(
              () => reject("Interval Timeout"),
              interval - (Date.now() - padTurnon)
            )
          ),
          new Promise((_, reject) => {
            const intervalId = setInterval(() => {
              if (forceStopRef.current) {
                clearInterval(intervalId);
                reject("ForceStop");
              }
            }, 100);
          }),
        ]);

        // If wrong pad was pressed, reset progress
        if (typeof result === "string" && result.startsWith("wrong-pad")) {
          // Increment miss count for wrong pad press
          missCountRef.current++;
          setMissCount(missCountRef.current);
          currentHitCounts = 0;
          isstuck = false;
          setActivePadIndex(-1);
          await writeCharacteristic(
            connectedDevice[activepad].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
          await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
          continue;
        }

        // Turn off the pad's LED
        if (result === "Hit") {
          currentHitCounts++;
          hitCounts++;
          setUserHitCount(hitCounts);
          isstuck = true;

          if (currentHitCounts >= hitCount) {
            isstuck = false;
            currentHitCounts = 0;
            setActivePadIndex(-1);
            const padTurnoff = Date.now();
            const reactionTime = (padTurnoff - padTurnon) / 1000;
            
            // Update ref immediately and state
            reactionTimeRef.current = [...reactionTimeRef.current, reactionTime];
            setReaction_time([...reactionTimeRef.current]);
            
            await writeCharacteristic(
              connectedDevice[activepad].device,
              CHARACTERISTIC.LED,
              "AAAA"
            );

            // Delay before activating the next pad
            await new Promise((resolve) =>
              setTimeout(resolve, delaytime * 1000)
            );
          }
        }
      } catch (error) {
        if (error === "Interval Timeout") {
          isstuck = false;
          missCountRef.current++;
          setMissCount(missCountRef.current);
          currentHitCounts = 0;
          setActivePadIndex(-1);
          await writeCharacteristic(
            connectedDevice[activepad].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
          await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
        } else if (error === "Timeout") {
          break; // Exit the loop if total game timeout is reached
        } else if (error === "ForceStop") {
          break; // Exit the loop immediately if forceStop is triggered
        } else {
        }

        // Ensure the pad's LED is turned off in case of an error
        setActivePadIndex(-1);
        if (activepad >= 0) {
          await writeCharacteristic(
            connectedDevice[activepad].device,
            CHARACTERISTIC.LED,
            "AAAA"
          );
        }

        // Delay before activating the next pad
        await new Promise((resolve) => setTimeout(resolve, delaytime * 1000));
      }
    }

    // Final cleanup: turn off any active pad
    if (activepad >= 0) {
      await writeCharacteristic(
        connectedDevice[activepad].device,
        CHARACTERISTIC.LED,
        "AAAA"
      );
    }
    if (forceStopRef.current) {
      return;
    }
  };

  const play_2 = async (
    timeduration: number,
    interval: number,
    delay: number
  ) => {
    if (isPlaying) return;

    // Reset all game state values for new game
    let hit = 0;
    setUserHitCount(0);
    setPressButton(true);
    setaverageReactionTime(-1);
    reactionTimeRef.current = []; // Clear reaction time ref
    setReaction_time([]); // Clear previous reaction times
    setResult_reactionTime([]); // Clear result reaction times
    setActivePadIndex(-1); // Reset active pad
    setPlayTime(0); // Reset play time
    setMissCount(0); // Reset miss count
    missCountRef.current = 0; // Reset miss count ref
    
    // Reset all refs
    startTimeRef.current = Date.now();
    gameEndTimeRef.current = null;
    firstLightTimeRef.current = null; // Reset first light time
    hitCountRef.current = 0;
    activePadIndexRef.current = -1;
    isHitRef.current = 1;
    isHitObjRef.current = [1, 1, 1, 1, 1, 1, 1, 1, 1];
    
    let startTime = Date.now();

    if (lightOut === "Hit") {
      await play_hit(hit);
    } else if (lightOut === "Timeout") {
      await play_timeout(hit, interval);
    } else if (lightOut === "Hit or Timeout") {
      await play_hitOrTimeout(hit, interval);
    }
    let endtime = Date.now();
    //setUserHitCount(hit); // Update the user's hit count
    
    // Use ref for immediate access to reaction times (state updates are async)
    const validReactionTimes = reactionTimeRef.current.filter(t => t >= 0);
    const totalReactionTime = reactionTimeRef.current.reduce((sum, time) => sum + Math.abs(time), 0);
    
    // Update state one final time to ensure it's current for the result modal
    setReaction_time([...reactionTimeRef.current]);
    
    setPressButton(false);
    setIsPlaying(false);
    setShowresult(true);
    // Calculate playTime from first light appearance
    const actualPlayTime = firstLightTimeRef.current 
      ? endtime - firstLightTimeRef.current 
      : endtime - startTime;
    setPlayTime(actualPlayTime);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/Mode')}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Hit Mode</Text>
        </View>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setShowConfigModal(true)}
        >
          <MaterialIcons name="info-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Configuration Modal */}
      <Modal
        visible={showConfigModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="settings" size={32} color="#4e54a3" />
              <Text style={styles.modalTitle}>การตั้งค่าเกม</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowConfigModal(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>การดับไฟ:</Text>
                <Text style={styles.configValue}>{lightOut || 'Not Set'}</Text>
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>เงื่อนไขการจบเกม:</Text>
                <Text style={styles.configValue}>{duration || 'Not Set'}</Text>
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>เป้าหมายจำนวนครั้งที่ต้องตี:</Text>
                <Text style={styles.configValue}>{hitCount > 0 ? hitCount : 'N/A'}</Text>
              </View>
              {/* <View style={styles.configRow}>
                <Text style={styles.configLabel}>ระยะเวลาการตี:</Text>
                <Text style={styles.configValue}>{hitduration > 0 ? hitduration : 'N/A'}</Text>
              </View> */}
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>ไฟดับภายใน:</Text>
                <Text style={styles.configValue}>{timeout > 0 ? `${timeout}ms` : 'N/A'}</Text>
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>ดีเลย์ไฟ:</Text>
                <Text style={styles.configValue}>{lightDelay || 'N/A'} {delaytime > 0 ? `(${delaytime}s)` : ''}</Text>
              </View>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>ระยะเวลาไฟดับ:</Text>
                <Text style={styles.configValue}>{minDuration}m {secDuration}s</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Game Controls */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => {
          if (isPlaying) {
            forceStopRef.current = true;
            setIsPlaying(false);
            gameEndTimeRef.current = Date.now();
            setShowresult(true);
            connectedDevice.forEach(async (deviceObj) => {
              if (deviceObj && deviceObj.device) {
                await blink(deviceObj.device);
              }
            });
            setPressButton(false);
          } else {
            
            // Reset all game state before starting new game
            forceStopRef.current = false;
            reactionTimeRef.current = []; // Clear reaction time ref
            setReaction_time([]); // Clear reaction times for new game
            setResult_reactionTime([]); // Clear result reaction times
            setUserHitCount(0); // Reset hit count for new game
            setActivePadIndex(-1); // Reset active pad
            setPlayTime(0); // Reset play time
            setaverageReactionTime(-1); // Reset average reaction time
            
            // Reset all refs
            startTimeRef.current = Date.now();
            gameEndTimeRef.current = null;
            firstLightTimeRef.current = null;
            hitCountRef.current = 0;
            activePadIndexRef.current = -1;
            isHitRef.current = 1;
            isHitObjRef.current = [1, 1, 1, 1, 1, 1, 1, 1, 1];
            
            setIsPlaying(true);
            play_2(
              (minDuration * 60 + secDuration) * 1000,
              timeout * 1000,
              delaytime * 1000
            );
            setShowresult(false);
          }
        }}
      >
        <Text style={styles.buttonText}>
          {pressButton ? `กำลังเล่น...` : "เริ่มเกม"}
          {/* {pressButton ? `force stop` : "Start Game"} */}
        </Text>
      </TouchableOpacity>
      {/* Game Status */}
      {/* {isPlaying && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>เกมกำลังเล่น...</Text>
        </View>
      )} */}

      {/* Statistics */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>สถิติ</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userHitCount}</Text>
            <Text style={styles.statLabel}>ถูก(ครั้ง)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{missCount}</Text>
            <Text style={styles.statLabel}>พลาด(ครั้ง)</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {userHitCount + missCount > 0 
                ? ((userHitCount / (userHitCount + missCount)) * 100).toFixed(1)
                : 0}%
            </Text>
            <Text style={styles.statLabel}>ความแม่นยำ</Text>
          </View>
        </View>
      </View>
      </ScrollView>

      {/* Pad Area Container */}
      <View style={styles.padAreaContainer}>
        <View style={styles.padAreaHeader}>
          <Text style={styles.padAreaTitle}>พื้นที่ปุ่ม</Text>
          {!isPlaying && (
            <Text style={styles.padAreaSubtitle}>ลากปุ่มเพื่อจัดตำแหน่ง</Text>
          )}
        </View>
        <View style={styles.padPlayArea}>
          <ShowPad isPlaying={isPlaying} activePadIndex={activePadIndex} />
        </View>
      </View>

      {/* Display the current hit count */}

      {showResult && (
        <FullResult
          showResult={showResult}
          isHitMode={isHitMode}
          isTimeMode={isTimeMode}
          isHitModeDur={isHitModeDur}
          isTimeModeDur={isTimeModeDur}
          onClose={handleCloseResult}
          lightOut={lightOut}
          timeout={timeout}
          hitCount={hitCount}
          delayTime={delaytime}
          duration={duration}
          minDuration={minDuration}
          secDuration={secDuration}
          hitDuration={hitduration}
          playTime={reactionTimeRef.current.reduce((sum, time) => sum + Math.abs(time), 0)}
          userHitCount={userHitCount}
          averageReactionTime={calculateAverageReactionTime(reactionTimeRef.current)}
          reaction_time={reactionTimeRef.current}
          missCount={missCount}
        />
      )}
      {/* </TouchableOpacity> */}

      {/* </TouchableOpacity> */}
    </SafeAreaView>
  );
};

// Define the styles for the component
// Define the styles for the component
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf7ff' },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#4e54a3',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  configValue: {
    fontSize: 15,
    color: '#4e54a3',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4e54a3',
  },
  statusText: {
    fontSize: 18,
    color: '#4e54a3',
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4e54a3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  padAreaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 2,
    borderTopColor: '#4e54a3',
  },
  padAreaHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#4e54a3',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  padAreaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  padAreaSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  padPlayArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  iconContainer: { position: "absolute", alignItems: "center" },
  playButton: {
    backgroundColor: "#4e54a3",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  result_container: {
    flex: 1,
    backgroundColor: "#E6F7F4",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    alignItems: "center",
    justifyContent: "center",
  },
  detailBox: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginVertical: 8,
  },
  separator: {
    fontSize: 12,
    color: "#000000",
    marginBottom: 12,
  },
  col: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: "#000000",
  },
  output: {
    fontSize: 14,
    color: "#2E7D32",
  },
  buttonText: {
    color: "white", // Text color
    fontWeight: "bold", // Bold font weight
    fontSize: 16, // Font size
  },
  buttonText2: {
    color: "red",
    fontWeight: "bold",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4A4A4A",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
    alignItems: "center",
    width: "70%",
  },
});

export default StartGame; // Export the StartGame component
