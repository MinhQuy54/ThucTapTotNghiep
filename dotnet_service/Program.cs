var builder = WebApplication.CreateBuilder(args);

// --- 1. PHẦN ĐĂNG KÝ DỊCH VỤ (SERVICES) ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Di chuyển AddCors lên TRÊN builder.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()   // Cho phép mọi nguồn (bao gồm cổng 5500 của bạn)
              .AllowAnyMethod()   // Cho phép mọi phương thức (GET, POST...)
              .AllowAnyHeader();  // Cho phép mọi Header
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();