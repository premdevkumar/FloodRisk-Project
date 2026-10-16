terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

# ECS Cluster
resource "aws_ecs_cluster" "flood_cluster" {
  name = "flood-platform-cluster"
}

# Task Execution Role
resource "aws_iam_role" "ecs_execution_role" {
  name = "flood-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_attach" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Definition for Backend
resource "aws_ecs_task_definition" "backend_task" {
  family                   = "flood-backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "flood-backend"
      image     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/flood-backend:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
        }
      ]
      environment = [
        { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
        { name = "DB_HOST", value = "flood-postgis-cluster.internal" }
      ]
    }
  ])
}

# ECS Fargate Service
resource "aws_ecs_service" "backend_service" {
  name            = "flood-backend-service"
  cluster         = aws_ecs_cluster.flood_cluster.id
  task_definition = aws_ecs_task_definition.backend_task.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = ["subnet-abc12345", "subnet-def67890"]
    security_groups  = ["sg-floodbackend123"]
    assign_public_ip = true
  }
}

# ──────────────────────────────────────────────
# AWS Target Tracking Auto-Scaling Policy
# ──────────────────────────────────────────────
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.flood_cluster.name}/${aws_ecs_service.backend_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu_scaling" {
  name               = "flood-backend-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
