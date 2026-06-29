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
  private suppressBroadcast = false;
  ngOnInit(): void {

    // ✅ DataManager
    this.data = new DataManager({
      url: 'https://localhost:7297/Home/DataSource',
      batchUrl: 'https://localhost:7297/Home/BatchUpdate',
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

    // ✅ SignalR setup
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7297/ganttHub")
      .withAutomaticReconnect()
      .build();

    this.startSignalR();
  }

  // ✅ Start SignalR connection
  startSignalR() {

    this.connection.start()
      .then(() => {
        console.log('✅ SignalR Connected');
        this.connectionId = this.connection.connectionId!;
      })
      .catch(err => console.error(err));

    // ✅ Receive updates
    this.connection.on("ReceiveTaskChange", (message: any) => {

      // ✅ Ignore self messages (KEY FIX)
      if (message.sender === this.connectionId) {
        return;
      }
      this.suppressBroadcast = true;   // ✅ BLOCK sending
      const { type, data } = message;

      if (type === 'add') {
        this.ganttObj.addRecord(data);
      }

      if (type === 'update') {
        this.ganttObj.updateRecordByID(data);
      }

      if (type === 'delete') {
        this.ganttObj.deleteRecord(data.taskId);
      }

    });
  }

  // ✅ Trigger when user changes data
  actionComplete(args: any) {
    
    // ✅ HARD BLOCK (THIS IS THE REAL FIX)
    if (this.suppressBroadcast && (args.requestType == "save" || args.requestType == "add" || 
args.requestType == "delete")) {
      this.suppressBroadcast = false;
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
 
  // ✅ Common send method (GLOBAL)
  private sendMessage(type: string, data: any) {
    const payload = {
      type,
      data,
      sender: this.connectionId
    };

    this.connection.invoke('BroadCastTaskChange', payload)
      .catch(err => console.error(err));
  }
}