using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using LoadChildOnDemand.Models;
using System.Collections;
using Syncfusion.EJ2.Base;
using Syncfusion.EJ2.Linq;
using Newtonsoft.Json.Linq;
using Syncfusion.EJ2;
using System.Reflection.Metadata;

namespace LoadChildOnDemand.Controllers
    {

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
    }
    public static List<TreeData> DataList = null;
        

        public IActionResult DataSource([FromBody] DataManagerRequest dm)
        {
            var DataSource = TreeData.GetTree();
            int count = DataSource.Count;
            DataList = DataSource;
            
            return dm.RequiresCounts ? Json(new { result = DataSource, count = count }) : Json(DataSource);
        }

        [HttpGet]
        [Route("Home/GetGanttColumns")]
        public IActionResult GetGridColumns()
        {
            var columns = new List<object>{
                new { field = "taskId" },
                new { field = "taskName", template = "<div style='color: purple; font-weight: bold;'>${taskName}</div>"},
                new { field = "startDate" },
                new { field = "endDate" },
                new { field = "progress" },
                new { field = "duration" }
            };
            return Json(columns);
        }
        public class CRUDModel
        {
            public List<TreeData> Added { get; set; }
            public List<TreeData> Changed { get; set; }
            public List<TreeData> Deleted { get; set; }
            public TreeData Value { get; set; }
            public int key { get; set; }
            public string action { get; set; }
        }
        
        public IActionResult BatchUpdate([FromBody] CRUDModel batchmodel)
        {
            try { 
                if (batchmodel.Changed != null && batchmodel.Changed.Count != null)
                {
                   

                    for (var i = 0; i < batchmodel.Changed.Count(); i++)
                    {
                        var value = batchmodel.Changed[i];
                        TreeData result = DataList.Where(or => or.taskId == value.taskId).FirstOrDefault();
                        result.taskId = value.taskId;
                        result.taskName = value.taskName;
                        result.startDate = value.startDate;
                        result.endDate = value.endDate;
                        result.duration = value.duration;
                        result.progress = value.progress;
                        result.predecessor = value.predecessor;
                        result.parentID = value.parentID;
                        result.info = value.info;

                    }
                    
                }
                if (batchmodel.Deleted != null)
                {
                    for (var i = 0; i < batchmodel.Deleted.Count; i++)
                    {
                        DataList.Remove(DataList.Where(ds => ds.taskId == batchmodel.Deleted[i].taskId).FirstOrDefault());
                    }
                }
                if (batchmodel.Added != null)
                {
                    
                    
                    for (var i = 0; i < batchmodel.Added.Count(); i++)
                    {
                        DataList.Insert(0, batchmodel.Added[i]);
                    }

                }
                
                return Json(new { addedRecords = batchmodel.Added, changedRecords = batchmodel.Changed, deletedRecords = batchmodel.Deleted });
            }
            catch (Exception ex)
            {
                // Return the exception message in the response
                return StatusCode(500, new
                {
                    error = ex.Message
                });
            }
        }

        

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
}