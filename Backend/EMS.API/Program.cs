using EMS.API.Data;
using EMS.API.Repositories;
using EMS.API.Repositories.Interfaces;
using EMS.API.Services;
using EMS.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5000");

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IReservationsRepository, ReservationsRepository>();
builder.Services.AddScoped<IReservationsService, ReservationsService>();
builder.Services.AddScoped<IHotelsRepository, HotelsRepository>();
builder.Services.AddScoped<IHotelsService, HotelsService>();
builder.Services.AddScoped<IInvestorsRepository, InvestorsRepository>();
builder.Services.AddScoped<IInvestorsService, InvestorsService>();
builder.Services.AddScoped<IPresentersRepository, PresentersRepository>();
builder.Services.AddScoped<IPresentersService, PresentersService>();
builder.Services.AddScoped<ISectorsRepository, SectorsRepository>();
builder.Services.AddScoped<ISectorsService, SectorsService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasMigrations = db.Database.GetMigrations().Any();
    if (hasMigrations)
    {
        await db.Database.MigrateAsync();
    }
    else
    {
        await db.Database.EnsureCreatedAsync();
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAngular");

app.MapControllers();

app.Run();
