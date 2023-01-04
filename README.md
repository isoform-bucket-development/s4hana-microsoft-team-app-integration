# Approve SAP S/4HANA Purchase Order in Microsoft Teams App
In this project, we would like to demonstrate how to integrate the SAP S/4HANA with the Microsoft Teams App, so that the user could perform the SAP S/4HANA purchase order approval in the Microsoft Teams App.

## Business Scenario

![Capture](https://user-images.githubusercontent.com/29527722/208214036-a1ac0fa6-1a00-4a21-bba4-850d609fac72.PNG)

- The buyer creates a new Purchase Order in SAP S/4HANA On-Premises system.
- The purchase manager receives a notification in Microsoft Teams in the form of a dialog card.
- The purchases manager can view the details of the Purchase Order in the Microsoft Teams.
- The purchases manager can 
  - Approve the purchase order in the Microsoft Teams.
  - Reject the purchase order in the Microsoft Teams.
  - Forward the purchase order data as an adaptive card to the buyer and request more information.

## System Architecture Diagram

![shortcut](https://user-images.githubusercontent.com/29527722/210670777-e5465805-3156-404d-9a32-1eed1512f17f.png)

The **SAP BTP Bridge Framework** is the **key component** that **connecting** the **SAP S/4HANA** and **Microsoft Teams**. It is an SAP BTP based integration framework and allows user to define the UI of the extension application which will be installed in the Microsoft Teams easily and quickly by fill out JSON configuration files. 

 
The **SAP BTP Bridge Framework** also provides an **automation tool** that help you **creates underlying resources on Microsoft Azure and SAP BTP**, **deploys Bridge Framework** in your SAP BTP Subaccount, and **generates Microsoft Teams extension app**. 

 
**After the administrator installs the extension application generated by the Bridge Framework in the Microsoft Teams app**, the purchase order creator and approver will sign-in with the extension application in the Microsoft Teams app.

  - purchase order creator and approver's Microsoft Teams conversation reference will be stored in the **Microsoft Blob Storage** Service.
 

**After the purchase order creator creates a new purchase order**

  - There is an SAP S/4HANA ABAP job running on the background in the SAP S/4HANA system to send the purchase order data and release purchase order workflow data to the message queue in the SAP BTP Event Mesh Service.
  
  - The Bridge Framework backend service listening on the message queue, consume the data coming from SAP S/4HANA system.
  
  - The Bridge Framework backend service process the data, get purchase order approver information, and generate the notification card.
  
    - Extract the email address of purchase order creator and purchase order approver from the message.
    - Fetch purchase order approver's user profile by calling Microsoft Graph Service.
    - Fetch purchase order approver's conversation reference based on user profile by calling Microsoft Blob Storage Service.
    - Encapsulate the purchase order data and workflow instance data into the notification card.
  - The Microsoft Bot Service send notification card to the purchase order approver based on the conversation reference.
 

**After the purchase order approver receive the notification card in the Microsoft Teams app**, they could view the details information of purchase order, and approve/reject the purchase order by click the button in the notification card. The implementation of this functionality is

  - Once the user clicks the button, the Microsoft Teams token, which contains user information, will be send to the Bridge Framework backend service.

  - The Bridge Framework backend service will exchange the user's Microsoft Teams token to the SAP BTP Access Token via principal propagation.
  
  - The Bridge Framework will consume the SAP S/4HANA Purchase Order API, along with user's BTP access token, to fetch the purchase order data from SAP S/4HANA system.

  - The Bridge Framework will consume the SAP S/4HANA Task Gateway Service, along with user's BTP access token, to update the workflow instance data in SAP S/4HANA system to approve/reject the purchase order.
  
  - In-order to consume the SAP S/4HANA APIs from the SAP BTP, the SAP BTP Destination Service, and SAP BTP Connectivity Service is needed.
  
  - The Cloud Connector needs to be installed in the SAP S/4HANA system, to enable the communication between SAP S/4HANA and SAP BTP.

## How to obtain support
[Create an issue](https://github.com/SAP-samples/<repository-name>/issues) in this repository if you find a bug or have questions about the content.
 
## License
Copyright (c) 2022 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
