#!/usr/bin/env ruby
# frozen_string_literal: true

# Traditional Chinese (zh-hant) to Simplified Chinese (zh-hans) converter
# Uses OpenCC with hk2s (Hong Kong Traditional to Simplified) configuration
#
# Usage: ruby scripts/convert_hant_to_hans.rb

require 'fileutils'
require 'open3'

SOURCE_DIR = 'zh-hant/_posts'
TARGET_DIR = 'zh-hans/_posts'
OPENCC_CONFIG = 'hk2s'

def opencc_available?
  system('which opencc > /dev/null 2>&1')
end

def convert_text(text)
  return text if text.nil? || text.empty?

  # Use OpenCC CLI to convert via pipe
  Open3.popen3('opencc', '--config', OPENCC_CONFIG) do |stdin, stdout, stderr, wait_thr|
    stdin.write(text)
    stdin.close
    result = stdout.read
    error = stderr.read

    if wait_thr.value.success?
      result
    else
      warn "OpenCC conversion failed: #{error}"
      text
    end
  end
end

def convert_file(source_path, target_path)
  content = File.read(source_path, encoding: 'UTF-8')

  # Split into front matter and body
  if content =~ /\A---\n(.*?)\n---\n(.*)/m
    front_matter = Regexp.last_match(1)
    body = Regexp.last_match(2)

    # Update lang in front matter
    front_matter = front_matter.gsub(/lang:\s*zh-hant/, 'lang: zh-hans')

    # Convert title in front matter
    front_matter = front_matter.gsub(/title:\s*"([^"]+)"/) do |match|
      converted_title = convert_text(Regexp.last_match(1))
      "title: \"#{converted_title}\""
    end

    # Convert excerpt in front matter
    front_matter = front_matter.gsub(/excerpt:\s*>\-\s*\n\s*(.+?)(?=\n\w|\n---|\z)/m) do |match|
      lines = match.lines
      excerpt_content = lines[1..].map { |l| l.strip }.join(' ')
      converted_excerpt = convert_text(excerpt_content)
      "excerpt: >-\n  #{converted_excerpt}"
    end

    # Convert body content
    converted_body = convert_text(body)

    # Reassemble
    converted_content = "---\n#{front_matter}\n---\n#{converted_body}"
  else
    # No front matter, convert entire content
    converted_content = convert_text(content)
  end

  # Write to target
  FileUtils.mkdir_p(File.dirname(target_path))
  File.write(target_path, converted_content, encoding: 'UTF-8')

  puts "✓ Converted: #{File.basename(source_path)}"
rescue StandardError => e
  warn "✗ Error converting #{source_path}: #{e.message}"
end

def main
  unless opencc_available?
    abort 'Error: OpenCC is not installed. Run: brew install opencc'
  end

  unless Dir.exist?(SOURCE_DIR)
    abort "Error: Source directory '#{SOURCE_DIR}' not found"
  end

  # Ensure target directory exists
  FileUtils.mkdir_p(TARGET_DIR)

  # Get all source files
  source_files = Dir.glob("#{SOURCE_DIR}/*.adoc")

  if source_files.empty?
    warn "Warning: No .adoc files found in #{SOURCE_DIR}"
    return
  end

  puts "Converting #{source_files.length} files from zh-hant to zh-hans (hk2s)..."
  puts

  success_count = 0
  error_count = 0

  source_files.each do |source_path|
    filename = File.basename(source_path)
    target_path = "#{TARGET_DIR}/#{filename}"

    # Skip if zh-hans version already exists (allows manual overrides)
    if File.exist?(target_path)
      puts "⊘ Skipped (exists): #{filename}"
      next
    end

    begin
      convert_file(source_path, target_path)
      success_count += 1
    rescue StandardError
      error_count += 1
    end
  end

  puts
  puts "Conversion complete!"
  puts "  ✓ Success: #{success_count}"
  puts "  ✗ Errors:  #{error_count}"
end

main if __FILE__ == $PROGRAM_NAME
