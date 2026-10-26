# Build and publish for the requested target platform; .NET 10 supports ARM64.
FROM mcr.microsoft.com/dotnet/sdk:10.0.100 AS build
ARG TARGETPLATFORM
ARG TARGETARCH
ARG BUILDPLATFORM
RUN echo "I am running on $BUILDPLATFORM, building for $TARGETPLATFORM"

WORKDIR /source
COPY *.csproj .
RUN dotnet restore -a $TARGETARCH

COPY . .
RUN dotnet publish -c release -o /app -a $TARGETARCH --self-contained false --no-restore

# Runtime image
FROM mcr.microsoft.com/dotnet/runtime:10.0.13

# Npgsql uses GSSAPI for Kerberos authentication when configured.
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgssapi-krb5-2 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create an unprivileged application user
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --home-dir /app appuser

COPY --from=build --chown=appuser:appgroup /app/ .

USER appuser

ENTRYPOINT ["dotnet", "Worker.dll"]
