import { Component } from '@angular/core';
import { GanttAllModule} from '@syncfusion/ej2-angular-gantt';
import { DataManager, WebApiAdaptor, UrlAdaptor } from '@syncfusion/ej2-data';
import { RouterOutlet } from '@angular/router';
import { HubConnection} from '@microsoft/signalr';
import * as signalR from '@microsoft/signalr';
@Component({
  selector: 'app-root',
  imports: [GanttAllModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  public data?: Object;
    public taskSettings?: object;
    public columns?: object[];
    public timelineSettings?: object;
    public gridLines?: string;
    public labelSettings?: object;
    public projectStartDate?: Date;
    public projectEndDate?: Date;
    private connection!: HubConnection;
    public toolbar?: string[];
    public editSettings?: object;
    public ngOnInit(): void {
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
            parentID:'parentID'
        };
        this.columns = [
		    { field: 'taskId', visible: false },
            { field: 'taskName', headerText: 'Task Name', width: '250', clipMode: 'EllipsisWithTooltip' },
            { field: 'startDate' },
            { field: 'predecessor' },
            { field: 'duration' }
        ];
        this.timelineSettings = {
            timelineUnitSize: 50,
            topTier: {
                unit: 'Month',
                format: 'MMM dd, y',
            },
            bottomTier: {
                unit: 'Day',
            }
        };
        this.gridLines = 'Both';
        this.labelSettings = {
            leftLabel: 'taskName',
        };
        this.editSettings = {
            allowAdding: true,
            allowEditing: true,
            allowDeleting: true,
            allowTaskbarEditing: true,
            showDeleteConfirmDialog: true
        };
        this.toolbar = ['Add', 'Edit', 'Update', 'Delete', 'Cancel', 'ExpandAll', 'CollapseAll', 'Indent', 'Outdent'];
        this.projectStartDate = new Date('02/24/2021');
        this.projectEndDate = new Date('06/10/2021');
        
this.connection = new signalR.HubConnectionBuilder()
.withUrl("https://localhost:7297/chatHub", {
  withCredentials: true
})
.configureLogging(signalR.LogLevel.Information)
.build();

    }
    
created() {
    this.connection.on("ReceiveMessage", (message: string) => {
      const gantt = (document.getElementsByClassName('e-gantt')[0] as HTMLFormElement)["ej2_instances"][0];
      gantt.refresh();
    });
  
    this.connection.start()
      .then(() => {
        console.log("SignalR connection established successfully");
        // ✅ Only invoke after connection is started
        return this.connection.invoke('SendMessage', "refreshPages");
      })
      .catch((err: Error) => {
        console.error("Error establishing SignalR connection:", err.toString());
      });
  }
  
    actionComplete(args: any) {
        if (args.requestType === 'save' || args.requestType === "add" || args.requestType === 'delete') {
          //send a message from a connected client to all clients.
          this.connection.invoke('SendMessage', "refreshPages")
            .catch((err:Error ) => {
              console.error(err.toString());
            });
        }
    }
}
