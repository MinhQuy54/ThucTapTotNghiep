FROM mcr.microsoft.com/dotnet/sdk:6.0

WORKDIR /app
COPY . .

RUN dotnet restore
RUN dotnet build

CMD ["dotnet", "run", "--urls=http://0.0.0.0:7132"]