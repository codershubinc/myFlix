// app.controller.ts

import { Controller, Get, InternalServerErrorException, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { spawn } from 'child_process';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/health')
  async health() {
    this.logger.log('Health check request received');

    // Use a safe command that doesn't require sudo
    const command = 'fastfetch';
    const args = ['--logo', 'none']; // Example argument for fastfetch

    try {
      const output = await this.runCommand(command, args);
      return {
        status: 'ok',
        data: output.split('\n').filter(Boolean), // Split output into an array of lines
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      // Return a proper HTTP error response
      throw new InternalServerErrorException({
        status: 'error',
        message: 'Failed to execute health check command.',
        errorDetails: error,
      });
    }
  }

  /**
   * A helper function to run a shell command and return its output as a Promise.
   */
  private runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command, args);

      let stdout = '';
      let stderr = '';

      // Listen for data from the command's standard output
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Listen for data from the command's standard error
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle errors during process spawning itself (e.g., command not found)
      childProcess.on('error', (error) => {
        reject(error.message);
      });

      // Listen for the process to exit
      childProcess.on('close', (code) => {
        this.logger.log(`Child process exited with code ${code}`);
        if (code === 0) {
          // Success
          resolve(stdout);
        } else {
          // Failure
          reject(stderr || `Process exited with non-zero code: ${code}`);
        }
      });
    });
  }
}