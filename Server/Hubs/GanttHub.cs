using Microsoft.AspNetCore.SignalR;

namespace GanttSignalRBackend.Hubs
{
    public class GanttHub : Hub
    {

        public async Task JoinProject(string projectId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, projectId);
        }

        public async Task BroadCastTaskChange(string projectId, TaskChange change)
        {
            await Clients.OthersInGroup(projectId)
                         .SendAsync("ReceiveTaskChange", change);
        }

    }
    public class TaskChange
    {
        public string ProjectId { get; set; }
        public string Type { get; set; }
        public object Data { get; set; }
        public string Sender { get; set; }
    }
}
