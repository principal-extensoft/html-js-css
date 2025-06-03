[ApiController]
[Route("api/[controller]")]
public class TestCasesController : ControllerBase
{
    private readonly ITestCaseRepository _repo; // implement reading/writing JSON or DB

    [HttpGet]
    public IActionResult GetAll() => Ok(_repo.GetAllSummaries());

    [HttpGet("{id}")]
    public IActionResult Get(string id) {
      var json = _repo.GetJsonById(id);
      if (json == null) return NotFound();
      return Content(json, "application/json");
    }

    [HttpPost]
    public IActionResult Create([FromBody] JsonElement body) {
      _repo.Save(body.GetRawText());
      return CreatedAtAction(nameof(Get), new { id = /*extract id*/ }, null);
    }

    [HttpPut("{id}")]
    public IActionResult Update(string id, [FromBody] JsonElement body) {
      var success = _repo.Update(id, body.GetRawText());
      return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(string id) {
      var deleted = _repo.Delete(id);
      return deleted ? NoContent() : NotFound();
    }
}
