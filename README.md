# TCO to MQTT

Website to pilot the train.

This code is functional but needs to be optimized and simplified.
    •	It allows to display a HTML page on different PCs, tablets, telephones.
    •	Control turnout's positions by clicking on the respective image.
    •	The turnouts are controlled with an ESP8266 via an MQTT messages via Web socket.    
    •	An action on a web page representing the (TCO) optical control panel of the entire network, 
	     transmits the necessary messages to synchronize all others web.

ENCODAGE DU TOPIC

Le topic permettant de gérer les abonnements, il est important de bien 'ranger' les messages pour éviter 
que chaque périphérique ne soit contraint de traiter tous les messages (un premier filtre est donc réalisé 
en ne s'abonnant pas à tout).

Ainsi, le choix pour le 'codage' du topic sera:

	•	prefix (train)
	
	•	type
		o	cmd encodage d'un ordre.
		o	state message publiant un état
		o	debug message informatif pour le debug
		o	emerg pour traiter les urgences (sécurité)
		o	sync pour synchroniser les pages HTML des TCO si plusieurs sont actifs

	•	device type
		o	aig aiguillage
		o	pos capteur de position
		o	feu pour un feu de signalisation
		
	•	device id -> quel device est concerné ou a publié

Ainsi un topic comme train/cmd/aig/4 sera identifié comme "le payload est une commande à destination de l'aiguillage numéro 4"

ENCODAGE DU PAYLOAD

L'encodage du payload va dépendre fortement du type de device concerné par le message.
De même que le format sera assez libre pour les messages de debug.
     •    composer de 3 parties.
          o		pour la commande: la nouvelle valeur de la position \ Id de l'aiguillage \ l'ID du client
          o 	pour la synchronisation des autres client : 
          o     le nom de la class de l'image \ Id de l'aiguillage \ l'ID du client qui a demandé le changement.

