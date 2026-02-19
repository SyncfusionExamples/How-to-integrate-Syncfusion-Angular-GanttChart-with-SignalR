# Real-Time Syncfusion Gantt Chart with SignalR in Angular – Multi-User Project Sync Without Refresh 

The Syncfusion EJ2 Angular Gantt Chart is a robust project management tool that offers features like task editing, dependencies, resource management, and timeline visualization. Integrating it with SignalR, a library for real-time web functionality, allows for multi-user collaboration. This means multiple users can view and modify the same project data at the same time, with updates appearing instantly on all connected clients without needing to refresh the page. 

## What is SignalR?  

SignalR is a Microsoft library that simplifies adding real-time web functionality to applications. It enables bi-directional communication between server and client using WebSockets (with fallbacks to other techniques like long polling). 

## Key Benefits of SignalR 

- **Real-Time Updates**: Push notifications from server to clients instantly. 
- **Bi-Directional Communication**: Clients can send data to the server, and the server can broadcast to clients.
- **Scalability**: Handles high-traffic scenarios with efficient connections.
- **Fallback Support**: Works even if WebSockets are unavailable.
- **Ease of Use**: Abstracts complex real-time protocols into simple hub methods. 

## What is SignalR in the Context of Syncfusion Angular Gantt?  

SignalR acts as a bridge for broadcasting changes (e.g., task additions or edits) from one client to others via the server. When integrated with the Syncfusion Angular Gantt Chart, it enables seamless multi-user synchronization without manual refreshes. 

## Prerequisites 

Ensure the following software and packages are installed before proceeding: 

| Software/Package | Version | Purpose |
|------------------|---------|---------|
|Syncfusion License Key | Latest | Required for Syncfusion components|
|.NET SDK | 8.0 or later | Backend development with SignalR |
|Node.js & Angular CLI | 18+ | Frontend development with Angular |
|Visual Studio / VS Code | Latest | IDE for development |
|Basic knowledge of Angular, .NET Core, and SignalR  | N/A | Understanding the integration |

## Setting Up the Backend: .NET Core with SignalR 

**Step 1: Create ASP.NET Core Web API Project**

Create a new ASP.NET Core Web API project to host the SignalR hub. For detailed setup of a Gantt Chart backend, refer to the Getting started with ASP.NET CORE Gantt Control. 

1. Open Visual Studio or VS Code. 

2. Create a new project: ASP.NET Core Web API. 

3. Name it (e.g., GanttSignalRBackend). 

**Step 2: Create the SignalR Hub**

1. In the project root, create a folder named Hubs.  

2. Inside the Hubs folder, create a new file named ChatHub.cs with the following code 

```csharp
ChatHub.cs

using Microsoft.AspNetCore.SignalR;
namespace GanttSignalRBackend.Hubs   
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", message);
        }
    }
}
```

The SendMessage method broadcasts a message (e.g., "refreshPages") to all connected clients whenever a change occurs in the Gantt Chart. 

**Step 3: Configure SignalR Services and CORS**

Update the Program.cs file to register SignalR services and configure CORS so the Angular frontend can connect.

```csharp
using signalR.Hubs; // Adjust namespace if needed   
var builder = WebApplication.CreateBuilder(args);
// Add SignalR services
builder.Services.AddSignalR();
// Enable CORS   
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://localhost:4200") // Angular dev server URL
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Use CORS
app.UseCors();

// Map SignalR hub   
app.MapHub<ChatHub>("/chatHub");

app.Run();
```
- Registers SignalR services with the ASP.NET Core dependency injection container, enabling the application to support real-time communication features. 
 
- A CORS (Cross-Origin Resource Sharing) policy is defined to allow requests from the Angular frontend application. The policy explicitly permits connections from the Angular development server URL (e.g., http://localhost:4200 or https://localhost:4200).

## Setting Up the Frontend: Angular with Syncfusion Gantt 

**Step 1: Create a New Angular Project**

Create an Angular project and set up the Syncfusion Gantt Chart. Refer to the [Syncfusion Angular Gantt Documentation](https://ej2.syncfusion.com/angular/documentation/gantt/getting-started). 

```bash
ng new gantt-signalr   
cd gantt-signalr 
```

**Step 2: Install SignalR Client Package**

Install the SignalR client for Angular. 

```bash
npm install @microsoft/signalr --save
```

For Syncfusion Gantt setup, refer to [Syncfusion Angular Gantt Documentation](https://ej2.syncfusion.com/angular/documentation/gantt/getting-started#install-syncfusion-angular-gantt-package).

**Step 3: Register Syncfusion License**

Add your Syncfusion license key in app.component.ts. 

```ts
App.component.ts 
 
import { Component } from '@angular/core';   
import { registerLicense } from '@syncfusion/ej2-base';   

@Component({ 
  selector: 'app-root',
  templateUrl: './app.component.html',
})   

export class AppComponent {   
  constructor() {
    registerLicense('YOUR_SYNC_FUSION_LICENSE_KEY');
  }   

} 
```

**Step 4: Configure the Gantt Chart with Events**

To enable real-time collaboration, you need to integrate the Syncfusion Gantt Chart component into your Angular application and bind two important lifecycle events: created and actionComplete.

```html
<ejs-gantt id="ganttDefault" (actionComplete)="actionComplete($event)" (created)="created()">   
    <!-- Gantt configuration here (e.g., dataSource, taskFields) -->   
</ejs-gantt> 
```

**Step 5: Implement SignalR Connection**

In app.component.ts, import SignalR and set up the connection in the created event. 

**created:**

This  event to establish the SignalR connection to the backend hub. Initializing the connection here ensures that the real-time communication channel is ready as soon as the chart is displayed 

**actionComplete:**

This event fires whenever a user performs a significant action in the Gantt Chart, such as: 

- Adding a new task 
- Editing an existing task 
- Deleting a task
- Saving changes (in edit mode) 

In the actionComplete handler, check the requestType property of the event arguments to detect meaningful changes (add, edit, save, delete). When such an action occurs, invoke the SignalR hub method to broadcast a refresh notification to all connected clients.

```ts
App.component.ts

import { Component } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})   

export class AppComponent {   

  public connection: HubConnection;
  
  created() {
    this.connection = new HubConnectionBuilder()
      .withUrl('https://localhost:7297/chatHub', {
        withCredentials: true
      })
      .configureLogging(LogLevel.Information)
      .build();
    this.connection.on('ReceiveMessage', (message: string) => {
      if (message === 'refreshPages') {
        this.refreshGantt(); // Implement refresh logic
      }
    });
    this.connection.start()
      .then(() => {
        console.log('SignalR connection established');
        return this.connection.invoke('SendMessage', 'refreshPages');
      })
      .catch(err => console.error('SignalR Error: ', err));
  }

  actionComplete(args: any) {
    if (args.requestType === 'save' || args.requestType === "add" || args.requestType === 'delete') {
      this.connection.invoke('SendMessage', "refreshPages")
        .catch((err: Error) => {
          console.error(err.toString());
        });
    }
  }

  refreshGantt() {   
    // Logic to refresh Gantt data (e.g., rebind dataSource)
    console.log('Refreshing Gantt...');
  }
}
```

- **HubConnectionBuilder**: It is used to configure and create the SignalR connection to the backend hub. It allows you to specify the hub URL, authentication options (such as credentials), logging level, and reconnection behavior. Once configured, the .build() method creates the HubConnection instance that manages communication with the server 

- **on()**: This method registers a client-side listener for messages broadcast by the server. In this case, it listens for the 'ReceiveMessage' event sent from the hub. When a message is received (e.g., "refreshPages"), the callback function executes and triggers a refresh of the Gantt Chart to reflect the latest changes made by any user. 

- **invoke()**: This method allows the client to call a method on the server-side hub. In this implementation, it invokes the SendMessage method on the hub to broadcast a refresh notification to all connected clients whenever a significant change occurs in the Gantt Chart (e.g., adding, editing, or deleting a task).

## Integrating Syncfusion Angular Gantt with SignalR 

**Step 1: Install and Configure Angular Gantt Components** 

The Syncfusion Angular Gantt Chart package (@syncfusion/ej2-angular-gantt) has already been installed in your project via npm. 

To make the Gantt Chart component available throughout your Angular application, you need to import the GanttModule and register it in your module file. 

Open src/app/app.module.ts (or your main feature module if you're using a modular structure) and update it as follows. 

```ts
App.module.ts 
 
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { GanttModule } from '@syncfusion/ej2-angular-gantt';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, GanttModule],
  bootstrap: [AppComponent]
})

export class AppModule {}

//Add CSS styles in styles.css (e.g., for Tailwind theme). 

CSS
@import '../node_modules/@syncfusion/ej2-base/styles/tailwind3.css';
/* Add other Syncfusion styles as needed */
```
**Step 2: Update the Angular Gantt Component**

Update the sample to include a fully configured Syncfusion Gantt Chart with sample data binding. This step defines the basic structure of the Gantt component, including data source, task fields, and columns.

```html
App.component.html
 
<ejs-gantt id="ganttDefault" height="450px" [dataSource]="data" [taskFields]="taskFields"
           (actionComplete)="actionComplete($event)" (created)="created()">
    <e-columns>
        <e-column field='TaskID' headerText='Task ID'></e-column>
        <e-column field='TaskName' headerText='Task Name'></e-column>
        <!-- Add more columns --> 
    </e-columns>
</ejs-gantt> 
```

**Step 3: Implement Real-Time Refresh**

To ensure all connected users see the latest project state immediately after any change, implement the refreshGantt() method in your Angular component. This method is responsible for updating the Gantt Chart’s data when a refresh notification is received from SignalR.

```ts
refreshGantt() {
  // If data is from API, fetch again: this.ganttInstance.dataSource = await fetchData();
  this.ganttInstance.refresh(); // Refresh UI
} 
```
## How Real-Time Sync Works:

The integration enables seamless, instant updates across multiple users. The process follows this flow: 

- When User 1 makes a change like editing, adding, or deleting a task in the Gantt Chart. 

    → The actionComplete event is triggered. 

- Broadcast the change inside the actionComplete handler, the client checks the requestType (e.g., add, edit, save, delete).

  → If a meaningful change occurred, the client calls invoke('SendMessage', 'refreshPages') on the SignalR connection.  
  
  → This sends a lightweight notification to the server-side hub. 

- Server broadcasts to everyone once the SignalR hub receives the message and uses Clients.All.SendAsync("ReceiveMessage", "refreshPages") to push the notification to all connected clients. 

- All clients refresh only if every client receives the 'ReceiveMessage' event.

    → If the message is "refreshPages", the client executes refreshGantt(). 

    → The Gantt Chart updates its data (either by re-fetching from the API or refreshing the UI), and the latest project state appears instantly for all users. 

This mechanism ensures that collaborative changes are reflected in real time without requiring manual page refreshes, providing a smooth and responsive multi-user experience.

## Running the Application 

**Step 1: Build the Backend** Navigate to the backend project directory and run: 

```bash
dotnet build
```

**Step 2: Run the Backend**

```bash
dotnet run
``` 

It starts on https://localhost:7297. 

**Step 3: Run the Frontend** In the Angular project directory: 

```bash
ng serve
```

Access at http://localhost:4200. 

**Step 4: Test Real-Time Sync**

- Open two browser tabs at http://localhost:4200.
- In Tab 1, add/edit/delete a task. 
- Watch Tab 2 update instantly—no refresh needed!

**Complete Sample Repository**

Refer to the [client sample](https://github.com/SyncfusionExamples/How-to-integrate-Syncfusion-Angular-GanttChart-with-SignalR/Client) and [server sample](https://github.com/SyncfusionExamples/How-to-integrate-Syncfusion-Angular-GanttChart-with-SignalR/Server) for more details.

## Summary 

This guide demonstrates how to: 

1. Set up a .NET Core backend with SignalR hub.
2. Create an Angular frontend with Syncfusion Gantt Chart.
3. Integrate SignalR for real-time multi-user synchronization.
4. Handle events for instant updates without refreshes. 

The application now provides a collaborative project management tool. Experiment with adding database persistence (e.g., using Entity Framework) or advanced features like user-specific updates. For more, refer to Syncfusion documentation. 

