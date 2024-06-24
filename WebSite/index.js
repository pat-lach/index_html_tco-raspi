// Historique des modifications
// Patrick:
// 10/06/2024 :  optimisation du programme 
// 11/04/2024 :	synchronisation des clients Web pour les Aig
// 31/03/2024 :  mise à jour fonction câblage aiguillages
// 26/01/2024 :  web MQTT avec HTML et Javascript, affichage position Appareil de voie		
// 19/08/2023 :  Commande aiguillage via TCO de Patrick par click image 

// Variables MQTT
var topic_pub = "train/cmd/aig",   mess_pub  = "";
var topic_sub = "train/#",         mess_sub  = "";
var topic_sync= "train/sync/aig",  mess_sync = "";
var topic_arr = "",                mess_arr  = "";
var mess_state = "";
var mqtt;
var reconnectTimeout = 2000;
var toto , tyty;
var aig_id = "z";
var clientID, newApps , classNameSync;
var nextPosApp, prePosApp = 33;

// Positions initiales des appareils de voie 
var apps = [11, 22, 33, 41, 51, 63];
const aigStates = {
  "aig_pos_br_1":       { index: 0, newValue: 11, newClass: "aig_pos_br_2",     newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_br_2":       { index: 0, newValue: 12, newClass: "aig_pos_br_1",     newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_fork_r_1":   { index: 1, newValue: 21, newClass: "aig_pos_fork_r_2", newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_fork_r_2":   { index: 1, newValue: 22, newClass: "aig_pos_fork_r_1", newSrc: "sprites/aiguilles_move.png" },
  "aig1_pos_tri_r_1_0": { index: 2, newValue: 32, newClass: "aig1_pos_tri_r_2", newSrc: "sprites/aiguilles_move.png"},
  "aig1_pos_tri_r_2_0": { index: 2, newValue: 31, newClass: "aig1_pos_tri_r_1", newSrc: "sprites/aiguilles_move.png"},
  "aig1_pos_tri_r_1_1": { index: 2, newValue: 33, newClass: "aig1_pos_tri_r_3", newSrc: "sprites/aiguilles_move.png"},
  "aig1_pos_tri_r_3_1": { index: 2, newValue: 34, newClass: "aig1_pos_tri_r_1", newSrc: "sprites/aiguilles_move.png"},
  "aig_pos_bl_1":       { index: 3, newValue: 41, newClass: "aig_pos_bl_2",     newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_bl_2":       { index: 3, newValue: 42, newClass: "aig_pos_bl_1",     newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_tl_1":       { index: 4, newValue: 52, newClass: "aig_pos_tl_2",     newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_tl_2":       { index: 4, newValue: 51, newClass: "aig_pos_tl_1",     newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_tri_r_1_0":  { index: 5, newValue: 62, newClass: "aig_pos_tri_r_2",  newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_tri_r_2_0":  { index: 5, newValue: 61, newClass: "aig_pos_tri_r_1",  newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_tri_r_1_1":  { index: 5, newValue: 63, newClass: "aig_pos_tri_r_3",  newSrc: "sprites/aiguilles_move.png" },
  "aig_pos_tri_r_3_1":  { index: 5, newValue: 64, newClass: "aig_pos_tri_r_1",  newSrc: "sprites/aiguilles_move.png" }
};

// Afficher les valeurs initiales des Aigs
apps.forEach((app, index) => {
  document.getElementById(`App${index + 1}`).innerHTML = app; 
});

console.log(" setup: " + apps);

// Ajoute des écouteurs d'événements pour chaque élément avec la classe "case"
document.querySelectorAll(".case").forEach((app, index) => {
  app.addEventListener("click", (e) => handleCaseClick(e, index));
 // console.log(`Adding click event to element ${index}`); // permet de lister les différent click
});

// Fonction pour gérer le clic sur un élément
function handleCaseClick(e, index) { 
  e.stopPropagation();
  toto = e.target;
  aig_id = toto.id;  
  classNameClick =  toto.className;
  console.log(" ||** classNameClick: ", classNameClick, " indexAigClick: ",index);
  console.log(" ||** toto: ",toto);
  let stateKeyBase = Object.keys(aigStates).filter(key => key.startsWith(classNameClick)); // Recherche aig concerné
  console.log( " stateKeyBase: ", aigStates[stateKeyBase[0]].index);
  index =aigStates[stateKeyBase[0]].index; 
 
  if (stateKeyBase) {
    if (Array.isArray(stateKeyBase) && stateKeyBase.length === 2 ) { 
      console.log("  ||\\|  The array has two elements: " , stateKeyBase);
      prePosApp =  document.getElementById(aig_id).alt;
      console.log(" prePosApp: ",prePosApp );
      nextPosApp = cycleValue(prePosApp);
      console.log(" nextPosApp: ",nextPosApp );
      console.log("  ||\\|  prePosApp: ", prePosApp, "remplacé par: ", nextPosApp, " index: ", index);                 
     //console.log(aigStates[stateKeyBase[0]]);
      //console.log(aigStates[stateKeyBase[1]]);       
       const result = findState(index, nextPosApp);
    
      if (result) {
        console.log("Key:", result.key);
        console.log("State:", result.state);
      } else {
        console.log("No state found with index newValue.");
      }
      tyty = aigStates[result.key];
            
    } else if (Array.isArray(stateKeyBase) && stateKeyBase.length === 1) {
        tyty = aigStates[stateKeyBase];
        nextPosApp = tyty.newValue;
        console.log("The array has one elements: ", stateKeyBase , " nextPosApp: ",nextPosApp    );
        // console.log("one elements, tyty: " ,  tyty);   
        console.log (" aigStates[stateKeyBase]: ",aigStates[stateKeyBase]);        
    } else {
        (console.log("The array is wrong: ",stateKeyBase )) ; 
      } 
   
      if (tyty) {
        updateAppState(tyty.index, tyty.newValue, tyty.newClass, tyty.newSrc, aig_id);
      } else {
          console.error(`tyty not found for key: ${stateKey}`);
      }
    } else {
      console.error(`tyty key base not found for class: ${classNameClick}`);
    }
}
 
// Met à jour l'état de l'aiguillage ayant eu un Click.
function updateAppState(index, newValue, newClass, newSrc, aig_id) {
  toto = document.getElementById(aig_id);

  console.log(" update **  toto.className: ", toto.className, "remplacé par: ", newClass); 
 
  toto.className = newClass;
  toto.src = newSrc;
  apps[index] = newValue;

  document.getElementById(`App${index + 1}`).innerHTML = newValue; // mise à jour position Aig dans html
  prePosApp = nextPosApp;                                          // stockage dernière position
  console.log(" update **  PosApp: ", toto.getAttribute("alt"), "remplacé par: ", nextPosApp);
  toto.setAttribute("alt", nextPosApp);

  mess_state = `${newValue}/${aig_id}/${clientID}`;
  mess_sync  = `${classNameClick}/${aig_id}/${clientID}`;
  // console.log("** updateAppState ** mess_pub: ", mess_pub ,  " mess_sync: ",  mess_sync);
  mess_pub = mess_state.toString();
  document.getElementById("Topic_sync").value = topic_sync;
  document.getElementById("Topic_pub").value = topic_pub;
  document.getElementById("Mess_sync").value = mess_sync;
  document.getElementById("Mess_pub").value = mess_state;

  publishMessage(mess_pub, topic_pub);
}

// Gère les messages reçus en fonction du topic
function onMessageArrived(r_message) {
  mess_arr = r_message.payloadString;
  topic_arr = r_message.destinationName;
  topic_split = topic_arr.split("/");
  mess_split = mess_arr.split("/");

  document.getElementById("messages").innerHTML += `<span> -> onMessageArrived ${mess_arr} sent by topic ${topic_arr}</span><br>`;

  if (topic_split[1] == "cmd" && mess_split[2] == clientID) {   
    handleCmdMessage(mess_arr, topic_arr);

  } else if (topic_split[1] == "state") {                            
    document.getElementById("Topic_pub").value = topic_arr;
    document.getElementById("Mess_pub").value = mess_arr;  
    handleStateMessage(mess_arr, mess_split, topic_arr);

  } else if (topic_split[1] == "sync" && mess_split[2] != clientID) {
    document.getElementById("Topic_sync").value = topic_arr;
    document.getElementById("Mess_sync").value = mess_arr;
    handleSyncMessage(mess_arr, mess_split, topic_arr);
  }
}

function handleCmdMessage(mess_arr, topic_arr) {
  document.getElementById("Topic_sub").value = topic_arr;
  document.getElementById("Mess_sub").value = mess_arr;
  document.getElementById("Mess_sub").style = "color:green;border-color:green;font-weight:bold";
}

function handleStateMessage(mess_arr, mess_split, topic_arr, aig_id) { 
  mess_sub = document.getElementById("Mess_sub").value ;
    if (mess_arr == mess_sub) {
      toto.src = "sprites/aiguilles.png";
      document.getElementById("Mess_sub").value =  mess_arr;
      document.getElementById("Mess_sub").style =   "color:black;border-color:black;font-weight:bold";
      aig_id = mess_split[1];
      mess_sync  = `${classNameClick}/${aig_id}/${clientID}`;        
      publishMessage(mess_sync, topic_sync); 
    } else {
      document.getElementById("messages").innerHTML +=  "<span> Warning pas de retour état --> " + mess_arr + " pub --> " + mess_pub + "</span><br>";
      document.getElementById("Mess_sub").style =   "color:red;border-color:red;font-weight:bold";
    }
}

function handleSyncMessage(mess_arr, mess_split, topic_arr) {
  console.log("   ** handleSync.. * mess_split: ", mess_split);

  aig_id =  mess_split[1];
  aigsync = mess_split[1];
  classNameSync = mess_split[0];
  newApps =  document.getElementById("Mess_pub").value;
  newApps = newApps.split("/");
  newApps = newApps[0]; 
  console.log(" classNameSync: ",  classNameSync, " newApps: " + newApps, " aig_id: ", aig_id);

  stateKeyBase = Object.keys(aigStates).filter(key => key.startsWith(classNameSync)); // Recherche aig concerné
  console.log(" stateKeyBase: ", stateKeyBase );
  index =aigStates[stateKeyBase[0]].index; 

  if (aig_id === "c" ||aig_id === "f") {
      console.log("  || HandleSync..  Aig triple: " , stateKeyBase)         
      prePosApp =  document.getElementById(aig_id).alt;      
      nextPosApp = cycleValue(prePosApp);
      console.log("  ||\\  prePosApp: ", prePosApp, "remplacé par: ", nextPosApp, " index: ", index);
      result = findState(index, nextPosApp);
      if (result) {
        console.log("key:", result.key);
        console.log("State:", result.state);
      } else {
       console.log("No state found with index newValue.");
      }
       state = result.state;
       console.log(" state_aig tri: ", state);
  } else { 
        console.log("  ||HandleSyncMessage  Aig simple: " , stateKeyBase);
        key = classNameSync;
        state =  getStateForKey(key); 
        console.log(" state_1 element: ", state);
  }        
  
  if (state) {
      console.log(`Index: ${state.index}`);               
      console.log(`New Value: ${state.newValue}`);        
      console.log(`New Class: ${state.newClass}`);       
      console.log(`New Src: ${state.newSrc}`);            
       // const newClassName = state.newClass;
       // console.log(" newClassName: ", newClassName);
      console.log(" aig_id: ", aig_id);
      const titi = document.getElementById(aigsync);        
      if (titi) { 
          titi.className = state.newClass; // changer la class de l'élément à synchroniser
          titi.setAttribute("alt", nextPosApp);
          console.log( "next_titi: ", titi);
          const numApp = state.index;    // afficher valeur de l'Aig sur le TCO
          console.log(" num app: ", numApp);
          document.getElementById(`App${numApp+1}`).innerHTML = state.newValue;
       } else {
           console.error("Element not found with ID:", aig_id);
       }
  } else {
        console.error(`State not found for key: ${key}`);
  } 
    console.log(" ** Sync 4 ** synchro faite: " + apps);   
    console.log(" ****************************************** ");   
 } 

// Fonction pour récupérer tous les champs pour une clé donné
function getStateForKey(key) {
  return aigStates[key] ? aigStates[key]: null;
   }
 
 // ************* Fonction de publication MQTT ***************
function publishMessage(msg, topic) {
  // Vérification des arguments
  if (!msg || !topic) {
      console.error("Message ou topic manquant.");
      return;
  }
  try {      
     //  console.log(" ** publishMessage ** Publishing message:", msg, "to topic:", topic); // Log d'information avant l'envoi du message
      let Message = new Paho.MQTT.Message(msg); // Création du message MQTT
      Message.destinationName = topic;
      mqtt.send(Message); 
      // Mise à jour de l'élément HTML avec le message publié
      appendMessage(`   -> publishMessage "${msg}" sent to topic "${topic} `);
      } catch (error) {     // Gestion des erreurs      
      console.error(" Error publishing message:", error);
      appendMessage(` style="color: red;"> -> Error sending message "${msg}" to topic "${topic}": ${error.message}   `);
     }
}

// ************* Fonctions MQTT ***************

// Fonction pour démarrer la connexion au serveur MQTT via WebSocket
function startConnect() {
  //const path = typeof path !== "undefined" ? path : defaultPath;
  if (typeof path == "undefined") {
    path = "/mqtt";
  }
  // Créer le client MQTT Web + numéro aléatoire MQTT
  clientID = "web" + parseInt(Math.random() * 100, 10);
  mqtt = new Paho.MQTT.Client(host, port, clientID);

  // Définir les fonctions de rappel
  mqtt.onConnectionLost = onConnectionLost;
  mqtt.onMessageArrived = onMessageArrived;

// Options si username et password sont définis
 const options = {};
  if (username) options.userName = username;
  if (password) options.password = password;

  mqtt.connect({ ...options, onSuccess: onConnect });
   //  mqtt.connect(options); 
}

// Fonction appelée une fois connecté pour s'abonner au topic MQTT
function onConnect() {
  const topic = document.getElementById("Topic_sub").value;
  appendMessage(`-> Connecting: ${host} -> port: ${port} -> client Id: ${clientID} -> Subscribing: ${topic}   `);
  updateHTMLValues({ host, port, client: clientID });
  mqtt.subscribe(topic);
}

// Fonction de gestion de la perte de connexion
function onConnectionLost(responseObject) {
  appendMessage("ERROR: Connection is lost");
  if (responseObject.errorCode !== 0) {
    appendMessage(`ERROR: Connection lost: ${responseObject.errorMessage}`);
    clearConnectionDetails();
  }
}

// Fonction pour démarrer la déconnexion
function startDisconnect() {
  mqtt.disconnect();
  appendMessage("Starting Disconnect");
  clearConnectionDetails();
}

// ************* Fonctions utilitaires ***************

// Ajoute un message dans l'élément messages
function appendMessage(message) {
  document.getElementById("messages").innerHTML += `<span>${message}</span><br>`;
}

// Met à jour les valeurs des éléments HTML avec les valeurs fournies
function updateHTMLValues(values) {
  Object.keys(values).forEach(key => {
  document.getElementById(key).value = values[key];
  });
}

// Efface les détails de connexion dans les éléments HTML
function clearConnectionDetails() {
  updateHTMLValues({ host: "", port: "", client: "" });
}

function toggle(value, value1, value2) {
  return value === value1 ? value2 : value1;
}

const findState = (index, newValue) => { // fonction recherche key
  for (const key in aigStates) {
    if (aigStates[key].index === index && aigStates[key].newValue === newValue) {
      return { key, state: aigStates[key] };
     }
    }
    return null;
};    
  
function cycleValue(value) {
  switch (value) {
    case "31":
      return 33;
    case "33":
      return 34;
    case "34":
      return 32;
    case "32":
      return 31;
    case "61":
      return 63;
    case "63":
      return 64;
    case "64":
      return 62;
    case "62":
      return 61;
    default:
      return null; // ou une valeur par défaut si nécessaire
  }
}
console.log(" fin du setup: ")