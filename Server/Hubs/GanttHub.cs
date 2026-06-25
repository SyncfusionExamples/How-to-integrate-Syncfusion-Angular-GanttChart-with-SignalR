using Microsoft.AspNetCore.SignalR;

namespace signalR.Hubs
{
    public class GanttHub : Hub
    {
        public async Task BroadCastTaskChange(string message)
        {
            await Clients.All.SendAsync("ReceiveTaskChange", message);
        }
    }
}