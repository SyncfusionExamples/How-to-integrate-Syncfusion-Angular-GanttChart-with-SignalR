using Microsoft.AspNetCore.SignalR;

namespace GanttSignalRBackend.Hubs
{
    public class GanttHub : Hub
    {
        public async Task BroadCastTaskChange(string message)
        {
            await Clients.All.SendAsync("ReceiveTaskChange", message);
        }
    }
}