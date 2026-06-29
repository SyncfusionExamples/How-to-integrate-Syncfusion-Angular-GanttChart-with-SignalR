import { Component, ViewChild, OnInit } from '@angular/core';
import { GanttAllModule, GanttComponent } from '@syncfusion/ej2-angular-gantt';
import { DataManager, UrlAdaptor } from '@syncfusion/ej2-data';
import { RouterOutlet } from '@angular/router';
import * as signalR from '@microsoft/signalr';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GanttAllModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  @ViewChild('gantt')
  public ganttObj!: GanttComponent;
  public data!: Object;
  public taskSettings!: object;
  public columns!: object[];
  public editSettings!: object;
  public toolbar!: string[];
  private connection!: signalR.HubConnection;
  private connectionId!: string;
  private toRefreshGantt  = false;
  private projectId = "1"; // dynamic later (route, API, etc.)
  ngOnInit(): void {
    // DataManager
    this.data = new DataManager({
      url: 'https://localhost:xxxx/Home/DataSource', // Configure server-side port number
      batchUrl: 'https://localhost:xxxx/Home/BatchUpdate',
      adaptor: new UrlAdaptor(),
      crossDomain: true
    });
    this.taskSettings = {
      id: 'taskId',
      name: 'taskName',
      startDate: 'startDate',
      duration: 'duration',
      progress: 'progress',
      dependency: 'predecessor',
      parentID: 'parentID'
    };
    this.columns = [
      { field: 'taskId', headerText: 'ID', width: 80 },
      { field: 'taskName', headerText: 'Task Name', width: 150 },
      { field: 'startDate' },
      { field: 'duration' },
      { field: 'progress' }
    ];
    this.editSettings = {
      allowAdding: true,
      allowEditing: true,
      allowDeleting: true,
      allowTaskbarEditing: true
    };
    this.toolbar = ['Add', 'Edit', 'Update', 'Delete', 'Cancel'];
    // SignalR setup
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:xxxx/ganttHub") // Configure server-side port number
      .withAutomaticReconnect()
      .build();
  }
  
created() {

  this.connection.on("ReceiveTaskChange", (message: any) => {

  console.log("SignalR connection established successfully", message);

  const { projectId, type, data, sender } = message;

    if (projectId !== this.projectId) return;
    if (sender === this.connectionId) return;

    this.toRefreshGantt  = true;

    switch (type) {
      case 'add':
        this.ganttObj.addRecord(data);
        break;
      case 'update':
        this.ganttObj.updateRecordByID(data);
        break;
      case 'delete':
        this.ganttObj.deleteRecord(data.taskId);
        break;
    }
  });

  // IMPORTANT: make sequential flow
  this.connection.start()
    .then(() => {
		
      this.connectionId = this.connection.connectionId!;
      
      // RETURN this promise
      return this.connection.invoke("JoinProject", this.projectId);
    })
    .then(() => {
      console.log("Joined group successfully");
    })
    .catch(err => console.error(err));
}
  // Trigger when user changes data
  actionComplete(args: any) {
    
    // HARD BLOCK (THIS IS THE REAL FIX)
    if (this.toRefreshGantt  && (args.requestType == "save" || args.requestType == "add" || 
args.requestType == "delete")) {
      this.toRefreshGantt  = false;
      return;
    }
    switch (args.requestType) {
      case 'save':
        this.sendMessage('update', args.data.taskData);
        break;
      case 'add':
        this.sendMessage('add', args.newTaskData);
        break;
      case 'delete':
        this.sendMessage('delete', args.data[0].taskData);
        break;
    }
  }
 
 
// Global sender
  private sendMessage(type: string, data: any) {
    const payload = {
      ProjectId: this.projectId.toString(),
      Type: type,
      Data: data,
      Sender: this.connectionId
    };
    // IMPORTANT → pass TWO parameters
    this.connection.invoke(
      'BroadCastTaskChange',
      this.projectId.toString(),  // routing
      payload          // data
    ).catch(err => console.error(err));
  }
}