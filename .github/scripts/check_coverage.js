#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function parseFrontendCoverage(filePath) {
  if (!fs.existsSync(filePath)) return {covered: 0, total: 0};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    let covered = 0;
    let total = 0;
    Object.values(json).forEach((entry) => {
      // entry.s is a mapping of statement index -> hit count
      if (entry && entry.s && typeof entry.s === 'object' && !Array.isArray(entry.s)) {
        const vals = Object.values(entry.s);
        total += vals.length;
        covered += vals.filter(v => v > 0).length;
      } else if (entry && entry.s && Array.isArray(entry.s)) {
        total += entry.s.length;
        covered += entry.s.filter(v => v > 0).length;
      } else if (entry && entry.statementMap && entry.s) {
        const vals = Object.values(entry.s);
        total += vals.length;
        covered += vals.filter(v => v > 0).length;
      }
    });
    return {covered, total};
  } catch (err) {
    console.error('Failed to parse frontend coverage', err && err.message);
    return {covered: 0, total: 0};
  }
}

function parseBackendCoverage(filePath) {
  if (!fs.existsSync(filePath)) return {covered: 0, total: 0};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    const key = Object.keys(json)[0];
    if (!key) return {covered: 0, total: 0};
    const coverage = (json[key] && json[key].coverage) || json.coverage || null;
    if (!coverage) return {covered: 0, total: 0};
    let covered = 0;
    let total = 0;
    Object.values(coverage).forEach(arr => {
      if (!Array.isArray(arr)) return;
      total += arr.length;
      covered += arr.filter(v => v && v > 0).length;
    });
    return {covered, total};
  } catch (err) {
    console.error('Failed to parse backend coverage', err && err.message);
    return {covered: 0, total: 0};
  }
}

function pretty(n) {
  return Math.round(n * 100) / 100;
}

const args = process.argv.slice(2);
const threshold = Number(args[0] || process.env.COVERAGE_THRESHOLD || 90);
const combinedDir = path.join(process.cwd(), 'coverage_combined');

const frontendPath = path.join(combinedDir, 'frontend', 'coverage-final.json');
const backendPath = path.join(combinedDir, 'backend', '.resultset.json');

const fe = parseFrontendCoverage(frontendPath);
const be = parseBackendCoverage(backendPath);

const totalStatements = fe.total + be.total;
const totalCovered = fe.covered + be.covered;
const percent = totalStatements === 0 ? 0 : (totalCovered / totalStatements) * 100;

console.log('Coverage summary:');
console.log(`  Frontend: ${fe.covered}/${fe.total}`);
console.log(`  Backend:  ${be.covered}/${be.total}`);
console.log(`  Combined: ${totalCovered}/${totalStatements} -> ${pretty(percent)}%`);

if (percent < threshold) {
  console.error(`Coverage ${pretty(percent)}% is below the threshold of ${threshold}%`);
  process.exit(1);
}

console.log(`Coverage ${pretty(percent)}% meets the threshold of ${threshold}%`);
process.exit(0);
