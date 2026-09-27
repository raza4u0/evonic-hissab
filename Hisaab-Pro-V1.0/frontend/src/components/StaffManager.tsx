import React, { useState, useRef, useMemo } from 'react';
import { triggerPrint } from '../utils/printHelper';
import { convertAmountToBilingualWords } from '../utils/numberToWords';
import { Barcode } from './SalesManager';
import { 
  Users, UserCheck, Briefcase, Mail, Phone, MapPin, Calendar, 
  DollarSign, CreditCard, Clock, FileCheck2, Printer, Download, 
  Trash2, Edit3, Plus, Search, Building, ChevronRight, AlertTriangle, 
  CheckCircle, CheckCircle2, FileText, X, UploadCloud, UserPlus, AlertCircle, Eye, RefreshCw, FileSpreadsheet, Award, Info,
  BarChart2, LayoutGrid, List, Network, Cake, Sparkles, Copy, ExternalLink, ShieldCheck, Layers, MessageSquare, Check, Filter, Send, Columns
} from 'lucide-react';
import { Staff, StaffDocument, LeaveRecord, SalarySlip } from '../types';

interface StaffManagerProps {
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  activeCompanyId: string;
  company: any;
}

export default function StaffManager({ staff, setStaff, activeCompanyId, company }: StaffManagerProps) {
  // Navigation & Interactive states
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isAddingEdit, setIsAddingEdit] = useState<boolean>(false);
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'info' | 'salary' | 'docs' | 'leaves' | 'payslips' | 'letters' | 'attendance' | 'eos' | 'increments'>('info');
  const [viewMode, setViewMode] = useState<'split' | 'grid' | 'table' | 'org'>('split');
  const [showAnniversaries, setShowAnniversaries] = useState<boolean>(false);
  const [showExpiryNoticeModal, setShowExpiryNoticeModal] = useState<Staff | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [attDate, setAttDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attStatus, setAttStatus] = useState<'Present' | 'Absent' | 'Sick Leave' | 'Late'>('Present');
  const [attRemarks, setAttRemarks] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Resigned'>('All');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [nationalityFilter, setNationalityFilter] = useState<string>('All');
  const [printableDoc, setPrintableDoc] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);
  const [hoveredProjIndex, setHoveredProjIndex] = useState<number | null>(null);

  // SIF Export Generator Modal states
  const [isSifModalOpen, setIsSifModalOpen] = useState<boolean>(false);
  const [sifMonthYear, setSifMonthYear] = useState<string>('2026-07');
  const [sifEmployerId, setSifEmployerId] = useState<string>('');
  const [sifRoutingCode, setSifRoutingCode] = useState<string>('033999999');
  const [sifFilterPayment, setSifFilterPayment] = useState<'bank_only' | 'all'>('bank_only');
  const [sifCopied, setSifCopied] = useState<boolean>(false);
  const [showSifPreview, setShowSifPreview] = useState<boolean>(true);

  // Form states
  const initialFormState = {
    employeeId: '',
    name: '',
    photoUrl: '',
    designation: 'Sales Associate',
    department: 'Sales',
    joiningDate: new Date().toISOString().split('T')[0],
    dob: '',
    gender: 'Male' as 'Male' | 'Female',
    nationality: '',
    religion: '',
    phone: '',
    email: '',
    address: '',
    cityCountry: 'Dubai, UAE',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    basicSalary: 3000,
    housingAllowance: 0,
    transportAllowance: 0,
    foodAllowance: 0,
    otherAllowance: 0,
    overtimeRate: 20,
    paymentMethod: 'Bank Transfer' as 'Bank Transfer' | 'Cash',
    bankName: '',
    iban: '',
    workShift: 'Morning' as 'Morning' | 'Evening' | 'Night',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    workingHoursPerDay: 8,
    status: 'Active' as 'Active' | 'Inactive' | 'Resigned',
    visaExpiryDate: '',
    eidExpiryDate: '',
    passportExpiryDate: '',
    contractType: 'Limited' as 'Limited' | 'Unlimited',
    contractStartDate: '',
    contractEndDate: '',
    leaveBalanceTotal: 30,
    leaveBalanceUsed: 0,
    advanceSalaryGiven: 0,
    advanceSalaryInstallments: 0,
    advanceSalaryPending: 0
  };

  const [formData, setFormData] = useState(initialFormState);

  // Sub-record forms
  const [leaveTotalInput, setLeaveTotalInput] = useState<number>(30);
  const [leaveUsedInput, setLeaveUsedInput] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advanceInstallments, setAdvanceInstallments] = useState<number>(1);
  const [advancePending, setAdvancePending] = useState<number>(0);

  const [payMonth, setPayMonth] = useState('August 2026');
  const [payOTHours, setPayOTHours] = useState(0);
  const [payDeductions, setPayDeductions] = useState(0);
  const [payPreparedBy, setPayPreparedBy] = useState('');

  // Manual Leave Entry states for Admin/Operator
  const [manualLeaveType, setManualLeaveType] = useState<'Unpaid' | 'Sick' | 'Annual' | 'Maternity' | 'Paternity' | 'Other'>('Unpaid');
  const [manualLeaveStartDate, setManualLeaveStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualLeaveEndDate, setManualLeaveEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualLeaveNotes, setManualLeaveNotes] = useState<string>('');
  const [manualLeaveDaysInput, setManualLeaveDaysInput] = useState<number>(1);
  const [manualLeaveApprovedBy, setManualLeaveApprovedBy] = useState<string>('System Admin / Operator');

  const [joiningRef, setJoiningRef] = useState('STF/JR/2026/01');
  const [cancellationReason, setCancellationReason] = useState('Resignation');
  const [calcGratuity, setCalcGratuity] = useState(true);
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState<number>(0);
  const [eosExitDate, setEosExitDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Increments & Promotions local states
  const [incNewSalary, setIncNewSalary] = useState<number>(0);
  const [incDesignation, setIncDesignation] = useState<string>('');
  const [incDate, setIncDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [incApprovedBy, setIncApprovedBy] = useState<string>('Ahmed Al-Mansoori (Operations Manager)');

  // File Upload states
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('Passport');

  const activeCompanyStaff = useMemo(() => {
    return staff.filter(s => s.companyId === activeCompanyId);
  }, [staff, activeCompanyId]);

  // Unified currency formatter (GCC Compliance)
  const formatAED = (num: number) => {
    const currencyCode = company?.currency || 'AED';
    const symbol = company?.currencySymbol || currencyCode;
    const position = company?.symbolPosition || 'before';
    const decimals = ['BHD', 'OMR', 'KWD'].includes(currencyCode) ? 3 : 2;
    const formattedNum = num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
    return position === 'before' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
  };

  // Filter active staff only for active calculations
  const activeStaffOnly = useMemo(() => {
    return activeCompanyStaff.filter(s => s.status === 'Active');
  }, [activeCompanyStaff]);

  // Total Basic Salary for Active Staff
  const totalBasicSalary = useMemo(() => {
    return activeStaffOnly.reduce((sum, s) => sum + (s.basicSalary || 0), 0);
  }, [activeStaffOnly]);

  // Breakdown of Allowances for Active Staff
  const allowancesBreakdown = useMemo(() => {
    const housing = activeStaffOnly.reduce((sum, s) => sum + (s.housingAllowance || 0), 0);
    const transport = activeStaffOnly.reduce((sum, s) => sum + (s.transportAllowance || 0), 0);
    const food = activeStaffOnly.reduce((sum, s) => sum + (s.foodAllowance || 0), 0);
    const other = activeStaffOnly.reduce((sum, s) => sum + (s.otherAllowance || 0), 0);
    const total = housing + transport + food + other;
    return { housing, transport, food, other, total };
  }, [activeStaffOnly]);

  // Total Monthly Payroll Costs (Basic Salary + Allowances)
  const totalMonthlyPayroll = useMemo(() => {
    return totalBasicSalary + allowancesBreakdown.total;
  }, [totalBasicSalary, allowancesBreakdown.total]);

  // Total Monthly Advance Salary Deductions
  const totalAdvanceDeductions = useMemo(() => {
    return activeStaffOnly.reduce((sum, s) => {
      if (s.advanceSalaryPending && s.advanceSalaryPending > 0 && s.advanceSalaryInstallments && s.advanceSalaryInstallments > 0) {
        const installment = s.advanceSalaryPending / s.advanceSalaryInstallments;
        return sum + installment;
      }
      return sum;
    }, 0);
  }, [activeStaffOnly]);

  // 6 Months Salary Payments Projection
  const projectionData = useMemo(() => {
    const monthsList: { name: string; monthLabel: string; gross: number; deductions: number; net: number }[] = [];
    const currentDate = new Date();
    
    // We display projection for the next 6 months
    for (let i = 0; i < 6; i++) {
      const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthLabel = futureDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const name = futureDate.toLocaleString('default', { month: 'short' });
      
      let monthGross = 0;
      let monthDeductions = 0;
      
      activeStaffOnly.forEach(s => {
        const gross = (s.basicSalary || 0) + 
                      (s.housingAllowance || 0) + 
                      (s.transportAllowance || 0) + 
                      (s.foodAllowance || 0) + 
                      (s.otherAllowance || 0);
        monthGross += gross;
        
        if (s.advanceSalaryPending && s.advanceSalaryPending > 0 && s.advanceSalaryInstallments && s.advanceSalaryInstallments > 0) {
          const monthlyInstallment = s.advanceSalaryPending / s.advanceSalaryInstallments;
          if (i < s.advanceSalaryInstallments) {
            const remainingPending = s.advanceSalaryPending - (i * monthlyInstallment);
            if (remainingPending > 0) {
              monthDeductions += Math.min(monthlyInstallment, remainingPending);
            }
          }
        }
      });
      
      monthsList.push({
        name,
        monthLabel,
        gross: Number(monthGross.toFixed(2)),
        deductions: Number(monthDeductions.toFixed(2)),
        net: Number((monthGross - monthDeductions).toFixed(2))
      });
    }
    return monthsList;
  }, [activeStaffOnly]);

  const selectedStaff = useMemo(() => {
    return activeCompanyStaff.find(s => s.id === selectedStaffId);
  }, [activeCompanyStaff, selectedStaffId]);

  const attendanceStats = useMemo(() => {
    if (!selectedStaff) return { total: 0, present: 0, absent: 0, sick: 0, late: 0, rate: 100 };
    const log = selectedStaff.attendanceLog || [];
    const total = log.length;
    const present = log.filter(r => r.status === 'Present').length;
    const absent = log.filter(r => r.status === 'Absent').length;
    const sick = log.filter(r => r.status === 'Sick Leave').length;
    const late = log.filter(r => r.status === 'Late').length;
    
    const activeDays = present + late;
    const rate = total > 0 ? Math.round((activeDays / total) * 100) : 100;

    return { total, present, absent, sick, late, rate };
  }, [selectedStaff]);

  // Alert calculations for Emirates ID, Visa, Passport, Contract End
  const alertDays = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAlertStyle = (days: number | null) => {
    if (days === null) return null;
    if (days < 0) return { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-300 dark:border-rose-800', badge: 'bg-rose-600 text-white', label: 'Expired' };
    if (days <= 15) return { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900', badge: 'bg-rose-600 text-white', label: '< 15 Days' };
    if (days <= 30) return { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900', badge: 'bg-amber-500 text-white', label: '< 30 Days' };
    if (days <= 60) return { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900', badge: 'bg-orange-400 text-white', label: '< 60 Days' };
    return { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900', badge: 'bg-emerald-600 text-white', label: 'Safe' };
  };

  // Compile list of soon expiring items for widget
  const expiringItems = useMemo(() => {
    const list: { id: string; name: string; type: string; expiryDate: string; daysLeft: number }[] = [];
    activeCompanyStaff.forEach(s => {
      if (s.status !== 'Active') return;
      ['visaExpiryDate', 'eidExpiryDate', 'passportExpiryDate', 'contractEndDate'].forEach(field => {
        const d = s[field as keyof Staff] as string | undefined;
        if (d) {
          const days = alertDays(d);
          if (days !== null && days <= 60) {
            let label = 'Emirates ID';
            if (field === 'visaExpiryDate') label = 'Visa';
            if (field === 'passportExpiryDate') label = 'Passport';
            if (field === 'contractEndDate') label = 'Work Contract';
            list.push({ id: s.id, name: s.name, type: label, expiryDate: d, daysLeft: days });
          }
        }
      });
    });
    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [activeCompanyStaff]);

  // Upcoming Work Anniversaries & Birthdays (Current Month)
  const upcomingAnniversaries = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return activeCompanyStaff.filter(s => {
      if (!s.joiningDate) return false;
      const jDate = new Date(s.joiningDate);
      return jDate.getMonth() === currentMonth;
    }).map(s => {
      const years = new Date().getFullYear() - new Date(s.joiningDate).getFullYear();
      return { staff: s, years: Math.max(years, 1) };
    });
  }, [activeCompanyStaff]);

  // Department Matrix & Headcount Breakdown
  const departmentMatrix = useMemo(() => {
    const map = new Map<string, { members: Staff[]; totalSalary: number }>();
    activeCompanyStaff.forEach(s => {
      const dept = s.department || 'Operations';
      if (!map.has(dept)) {
        map.set(dept, { members: [], totalSalary: 0 });
      }
      const d = map.get(dept)!;
      d.members.push(s);
      const gross = (s.basicSalary || 0) + (s.housingAllowance || 0) + (s.transportAllowance || 0) + (s.foodAllowance || 0) + (s.otherAllowance || 0);
      d.totalSalary += gross;
    });
    return Array.from(map.entries()).map(([deptName, data]) => ({
      deptName,
      members: data.members,
      totalSalary: data.totalSalary,
      headcount: data.members.length
    }));
  }, [activeCompanyStaff]);

  // Filter & Search Staff
  const filteredStaff = useMemo(() => {
    return activeCompanyStaff.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesDept = deptFilter === 'All' || (s.department || 'Operations') === deptFilter;
      const matchesNationality = nationalityFilter === 'All' || (s.nationality || '').toLowerCase() === nationalityFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesDept && matchesNationality;
    });
  }, [activeCompanyStaff, searchTerm, statusFilter, deptFilter, nationalityFilter]);

  const availableDepts = useMemo(() => {
    const depts = new Set<string>();
    activeCompanyStaff.forEach(s => {
      if (s.department) depts.add(s.department);
    });
    return Array.from(depts);
  }, [activeCompanyStaff]);

  const availableNationalities = useMemo(() => {
    const nats = new Set<string>();
    activeCompanyStaff.forEach(s => {
      if (s.nationality) nats.add(s.nationality);
    });
    return Array.from(nats);
  }, [activeCompanyStaff]);

  // Auto Employee ID Generator
  const generateNextEmployeeId = () => {
    const activeStaff = staff.filter(s => s.companyId === activeCompanyId);
    if (activeStaff.length === 0) return 'STF-001';
    const ids = activeStaff.map(s => {
      const match = s.employeeId.match(/STF-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxId = Math.max(...ids, 0);
    return `STF-${String(maxId + 1).padStart(3, '0')}`;
  };

  const handleLoadDemoStaff = () => {
    const existingIds = activeCompanyStaff.map(s => s.employeeId);
    
    const demoStaffList: Staff[] = [
      {
        id: 'stf_demo_3_' + Date.now(),
        companyId: activeCompanyId,
        employeeId: 'STF-003',
        name: 'Maria Santos',
        designation: 'Sales Associate',
        department: 'Sales',
        joiningDate: '2024-06-10',
        dob: '1994-08-15',
        gender: 'Female',
        nationality: 'Filipino',
        religion: 'Christianity',
        phone: '+971 54 321 0987',
        email: 'maria.santos@gulfexports.ae',
        address: 'Satwa Building C, Apt 101',
        cityCountry: 'Dubai, UAE',
        emergencyName: 'Juan Santos',
        emergencyPhone: '+63 917 123 4567',
        emergencyRelationship: 'Brother',
        basicSalary: 4500,
        housingAllowance: 1000,
        transportAllowance: 500,
        foodAllowance: 200,
        otherAllowance: 0,
        overtimeRate: 25,
        paymentMethod: 'Bank Transfer',
        bankName: 'Mashreq Bank',
        iban: 'AE450140000001122334455',
        workShift: 'Morning',
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        workingHoursPerDay: 8,
        status: 'Active',
        visaExpiryDate: '2026-10-15',
        eidExpiryDate: '2026-10-15',
        passportExpiryDate: '2030-02-20',
        contractType: 'Limited',
        contractStartDate: '2024-06-10',
        contractEndDate: '2026-06-09',
        leaveBalanceTotal: 30,
        leaveBalanceUsed: 8,
        advanceSalaryGiven: 0,
        advanceSalaryInstallments: 0,
        advanceSalaryPending: 0,
        documents: [
          { name: 'Passport Copy', type: 'Passport', fileName: 'maria_passport.pdf', fileSize: '1.1 MB', uploadedAt: '2024-06-10' }
        ],
        leaveRecords: [],
        salarySlips: []
      },
      {
        id: 'stf_demo_4_' + Date.now(),
        companyId: activeCompanyId,
        employeeId: 'STF-004',
        name: 'Muhammad Bilal',
        designation: 'Senior Developer',
        department: 'IT',
        joiningDate: '2025-01-15',
        dob: '1990-03-05',
        gender: 'Male',
        nationality: 'Pakistani',
        religion: 'Islam',
        phone: '+971 58 111 2222',
        email: 'm.bilal@gulfexports.ae',
        address: 'Silicon Oasis, Gate 3, Apt 1402',
        cityCountry: 'Dubai, UAE',
        emergencyName: 'Aisha Bilal',
        emergencyPhone: '+92 300 1234567',
        emergencyRelationship: 'Spouse',
        basicSalary: 12000,
        housingAllowance: 3000,
        transportAllowance: 1000,
        foodAllowance: 0,
        otherAllowance: 500,
        overtimeRate: 60,
        paymentMethod: 'Bank Transfer',
        bankName: 'Dubai Islamic Bank',
        iban: 'AE560240000002233445566',
        workShift: 'Morning',
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        workingHoursPerDay: 8,
        status: 'Active',
        visaExpiryDate: '2027-01-14',
        eidExpiryDate: '2027-01-14',
        passportExpiryDate: '2029-08-11',
        contractType: 'Unlimited',
        contractStartDate: '2025-01-15',
        contractEndDate: '',
        leaveBalanceTotal: 30,
        leaveBalanceUsed: 0,
        advanceSalaryGiven: 3000,
        advanceSalaryInstallments: 3,
        advanceSalaryPending: 1000,
        documents: [],
        leaveRecords: [],
        salarySlips: []
      },
      {
        id: 'stf_demo_5_' + Date.now(),
        companyId: activeCompanyId,
        employeeId: 'STF-005',
        name: 'Sarah Jenkins',
        designation: 'Marketing Director',
        department: 'Marketing',
        joiningDate: '2023-11-01',
        dob: '1985-12-04',
        gender: 'Female',
        nationality: 'British',
        religion: 'Other',
        phone: '+971 55 999 8888',
        email: 'sarah.j@gulfexports.ae',
        address: 'Marina Heights, Apt 3804',
        cityCountry: 'Dubai, UAE',
        emergencyName: 'David Jenkins',
        emergencyPhone: '+44 7911 123456',
        emergencyRelationship: 'Father',
        basicSalary: 22000,
        housingAllowance: 6000,
        transportAllowance: 2000,
        foodAllowance: 0,
        otherAllowance: 1000,
        overtimeRate: 100,
        paymentMethod: 'Bank Transfer',
        bankName: 'HSBC Middle East',
        iban: 'AE780200000003344556677',
        workShift: 'Morning',
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        workingHoursPerDay: 8,
        status: 'Active',
        visaExpiryDate: '2026-10-31',
        eidExpiryDate: '2026-10-31',
        passportExpiryDate: '2032-04-14',
        contractType: 'Limited',
        contractStartDate: '2023-11-01',
        contractEndDate: '2025-10-31',
        leaveBalanceTotal: 30,
        leaveBalanceUsed: 15,
        advanceSalaryGiven: 0,
        advanceSalaryInstallments: 0,
        advanceSalaryPending: 0,
        documents: [],
        leaveRecords: [],
        salarySlips: []
      },
      {
        id: 'stf_demo_6_' + Date.now(),
        companyId: activeCompanyId,
        employeeId: 'STF-006',
        name: 'Youssef Hassan',
        designation: 'Logistics Supervisor',
        department: 'Logistics',
        joiningDate: '2024-09-01',
        dob: '1989-05-18',
        gender: 'Male',
        nationality: 'Egyptian',
        religion: 'Islam',
        phone: '+971 56 777 5555',
        email: 'youssef.h@gulfexports.ae',
        address: 'Deira Al Rigga, Building A, Apt 305',
        cityCountry: 'Dubai, UAE',
        emergencyName: 'Mustafa Hassan',
        emergencyPhone: '+20 100 1234567',
        emergencyRelationship: 'Brother',
        basicSalary: 6500,
        housingAllowance: 2000,
        transportAllowance: 1000,
        foodAllowance: 500,
        otherAllowance: 0,
        overtimeRate: 35,
        paymentMethod: 'Bank Transfer',
        bankName: 'Commercial Bank of Dubai',
        iban: 'AE150110000004455667788',
        workShift: 'Morning',
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        workingHoursPerDay: 8,
        status: 'Active',
        visaExpiryDate: '2026-08-31',
        eidExpiryDate: '2026-08-31',
        passportExpiryDate: '2028-06-25',
        contractType: 'Unlimited',
        contractStartDate: '2024-09-01',
        contractEndDate: '',
        leaveBalanceTotal: 30,
        leaveBalanceUsed: 5,
        advanceSalaryGiven: 0,
        advanceSalaryInstallments: 0,
        advanceSalaryPending: 0,
        documents: [],
        leaveRecords: [],
        salarySlips: []
      }
    ];

    const toAdd = demoStaffList.filter(d => !existingIds.includes(d.employeeId));
    
    if (toAdd.length === 0) {
      alert('Sample staff members are already loaded in the directory!');
      return;
    }

    setStaff(prev => [...prev, ...toAdd]);
    alert(`Success: Added ${toAdd.length} sample UAE staff members to your directory!`);
  };

  const handleSaveAttendance = (staffId: string) => {
    if (!attDate) {
      alert('Please select a valid date!');
      return;
    }

    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;

      const currentLog = s.attendanceLog || [];
      const filteredLog = currentLog.filter(record => record.date !== attDate);
      
      const newRecord = {
        date: attDate,
        status: attStatus,
        remarks: attRemarks.trim() || undefined
      };

      return {
        ...s,
        attendanceLog: [...filteredLog, newRecord].sort((a, b) => b.date.localeCompare(a.date))
      };
    }));

    setAttRemarks('');
    alert(`Attendance for ${new Date(attDate).toLocaleDateString('en-GB')} logged successfully!`);
  };

  const handleDeleteAttendance = (staffId: string, dateToDelete: string) => {
    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      const currentLog = s.attendanceLog || [];
      return {
        ...s,
        attendanceLog: currentLog.filter(record => record.date !== dateToDelete)
      };
    }));
  };

  // Open Form for Adding
  const handleAddNew = () => {
    setFormData({
      ...initialFormState,
      employeeId: generateNextEmployeeId()
    });
    setEditStaffId(null);
    setIsAddingEdit(true);
  };

  // Open Form for Editing
  const handleEdit = (s: Staff, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      employeeId: s.employeeId,
      name: s.name,
      photoUrl: s.photoUrl || '',
      designation: s.designation,
      department: s.department || 'Sales',
      joiningDate: s.joiningDate,
      dob: s.dob || '',
      gender: s.gender,
      nationality: s.nationality || '',
      religion: s.religion || '',
      phone: s.phone,
      email: s.email,
      address: s.address || '',
      cityCountry: s.cityCountry || 'Dubai, UAE',
      emergencyName: s.emergencyName,
      emergencyPhone: s.emergencyPhone,
      emergencyRelationship: s.emergencyRelationship,
      basicSalary: s.basicSalary,
      housingAllowance: s.housingAllowance,
      transportAllowance: s.transportAllowance,
      foodAllowance: s.foodAllowance,
      otherAllowance: s.otherAllowance,
      overtimeRate: s.overtimeRate,
      paymentMethod: s.paymentMethod,
      bankName: s.bankName || '',
      iban: s.iban || '',
      workShift: s.workShift,
      workingDays: s.workingDays,
      workingHoursPerDay: s.workingHoursPerDay,
      status: s.status,
      visaExpiryDate: s.visaExpiryDate || '',
      eidExpiryDate: s.eidExpiryDate || '',
      passportExpiryDate: s.passportExpiryDate || '',
      contractType: s.contractType || 'Limited',
      contractStartDate: s.contractStartDate || '',
      contractEndDate: s.contractEndDate || '',
      leaveBalanceTotal: s.leaveBalanceTotal ?? 30,
      leaveBalanceUsed: s.leaveBalanceUsed ?? 0,
      advanceSalaryGiven: s.advanceSalaryGiven ?? 0,
      advanceSalaryInstallments: s.advanceSalaryInstallments ?? 0,
      advanceSalaryPending: s.advanceSalaryPending ?? 0
    });
    setEditStaffId(s.id);
    setIsAddingEdit(true);
  };

  // Save Form
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email) {
      alert('Please fill out all required fields marked with *');
      return;
    }

    if (editStaffId) {
      // Update
      setStaff(prev => prev.map(s => {
        if (s.id === editStaffId) {
          return {
            ...s,
            ...formData,
            // Keep existing arrays if they are not in formData
            documents: s.documents || [],
            leaveRecords: s.leaveRecords || [],
            salarySlips: s.salarySlips || []
          };
        }
        return s;
      }));
    } else {
      // Create
      const newStaffObj: Staff = {
        id: 'stf_' + Date.now(),
        companyId: activeCompanyId,
        employeeId: generateNextEmployeeId(),
        ...formData,
        documents: [],
        leaveRecords: [],
        salarySlips: []
      };
      setStaff(prev => [...prev, newStaffObj]);
    }
    setIsAddingEdit(false);
  };

  const handleDeleteStaff = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this staff member? This is irreversible.')) {
      setStaff(prev => prev.filter(s => s.id !== id));
      if (selectedStaffId === id) setSelectedStaffId(null);
    }
  };

  // Quick Photo & Doc Upload simulation (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStaff) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newDoc: StaffDocument = {
          name: file.name,
          type: selectedDocType,
          fileName: file.name,
          fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          uploadedAt: new Date().toISOString().split('T')[0],
          dataUrl: reader.result as string
        };
        setStaff(prev => prev.map(s => {
          if (s.id === selectedStaff.id) {
            return {
              ...s,
              documents: [newDoc, ...(s.documents || [])]
            };
          }
          return s;
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Manual Update for Leaves
  const updateLeaveBalance = () => {
    if (selectedStaff) {
      setStaff(prev => prev.map(s => {
        if (s.id === selectedStaff.id) {
          return {
            ...s,
            leaveBalanceTotal: leaveTotalInput,
            leaveBalanceUsed: leaveUsedInput
          };
        }
        return s;
      }));
      alert('Leave balance updated successfully.');
    }
  };

  // Add Specific Date Leave Entry (Admin / Computer Operator capability)
  const handleAddManualLeaveRecord = () => {
    if (!selectedStaff) return;
    const days = Number(manualLeaveDaysInput) || 1;
    const newRecord: LeaveRecord = {
      id: 'LV-' + Date.now(),
      type: manualLeaveType,
      startDate: manualLeaveStartDate,
      endDate: manualLeaveEndDate,
      days: days,
      status: 'Approved',
      notes: manualLeaveNotes || `Manual leave entry recorded by ${manualLeaveApprovedBy}`
    };

    const existingRecords = selectedStaff.leaveRecords || [];
    const updatedRecords = [newRecord, ...existingRecords];
    
    let newUsed = selectedStaff.leaveBalanceUsed || 0;
    if (manualLeaveType === 'Annual') {
      newUsed += days;
    }

    const updatedStaffMember: Staff = {
      ...selectedStaff,
      leaveRecords: updatedRecords,
      leaveBalanceUsed: newUsed
    };

    setStaff(prev => prev.map(s => s.id === selectedStaff.id ? updatedStaffMember : s));
    setLeaveUsedInput(newUsed);
    setManualLeaveNotes('');
    alert(`Leave entry successfully recorded for ${selectedStaff.name} (${days} day(s) - ${manualLeaveType}).`);
  };

  // Manual Update for Advance Salary
  const updateAdvanceSalary = () => {
    if (selectedStaff) {
      setStaff(prev => prev.map(s => {
        if (s.id === selectedStaff.id) {
          return {
            ...s,
            advanceSalaryGiven: advanceAmount,
            advanceSalaryInstallments: advanceInstallments,
            advanceSalaryPending: advancePending
          };
        }
        return s;
      }));
      alert('Advance salary log updated successfully.');
    }
  };

  // Add Payslip Record
  const handleGeneratePayslipRecord = () => {
    if (selectedStaff) {
      const otPay = payOTHours * selectedStaff.overtimeRate;
      const netPay = (selectedStaff.basicSalary + selectedStaff.housingAllowance + selectedStaff.transportAllowance + selectedStaff.foodAllowance + selectedStaff.otherAllowance + otPay) - payDeductions;
      const newSlip: SalarySlip = {
        id: 'sl_' + Date.now(),
        monthYear: payMonth,
        basicSalary: selectedStaff.basicSalary,
        housingAllowance: selectedStaff.housingAllowance,
        transportAllowance: selectedStaff.transportAllowance,
        foodAllowance: selectedStaff.foodAllowance,
        otherAllowance: selectedStaff.otherAllowance,
        overtimeHours: payOTHours,
        overtimeRate: selectedStaff.overtimeRate,
        overtimePay: otPay,
        deductions: payDeductions,
        netSalary: netPay,
        paymentMethod: selectedStaff.paymentMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'Paid',
        preparedBy: payPreparedBy || undefined
      };

      setStaff(prev => prev.map(s => {
        if (s.id === selectedStaff.id) {
          return {
            ...s,
            salarySlips: [newSlip, ...(s.salarySlips || [])]
          };
        }
        return s;
      }));
      alert('Salary slip generated and stored successfully!');
    }
  };

  const handleSaveIncrement = () => {
    if (selectedStaff) {
      if (incNewSalary <= 0) {
        alert("Please enter a valid review salary greater than 0.");
        return;
      }
      const newLogItem = {
        id: 'inc_' + Date.now(),
        date: incDate,
        oldSalary: selectedStaff.basicSalary,
        newSalary: incNewSalary,
        designationChange: incDesignation.trim() || undefined,
        approvedBy: incApprovedBy.trim() || 'Management'
      };

      setStaff(prev => prev.map(s => {
        if (s.id === selectedStaff.id) {
          const updatedLogs = s.incrementLog || [];
          return {
            ...s,
            basicSalary: incNewSalary,
            designation: incDesignation.trim() ? incDesignation.trim() : s.designation,
            incrementLog: [newLogItem, ...updatedLogs]
          };
        }
        return s;
      }));

      setIncNewSalary(0);
      setIncDesignation('');
      alert("Promotion & salary review logged successfully! The employee's master card has been updated.");
    }
  };

  const handleDeleteIncrementLog = (logId: string) => {
    if (selectedStaff && confirm("Are you sure you want to delete this historical promotion/increment record?")) {
      setStaff(prev => prev.map(s => {
        if (s.id === selectedStaff.id) {
          const updatedLogs = (s.incrementLog || []).filter(item => item.id !== logId);
          return {
            ...s,
            incrementLog: updatedLogs
          };
        }
        return s;
      }));
    }
  };

  // CSV EXPORTS
  const exportToCSV = (headers: string[], rows: string[][], filename: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";
    rows.forEach(r => {
      csvContent += r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStaffList = () => {
    const headers = ['Employee ID', 'Full Name', 'Designation', 'Department', 'Phone', 'Email', 'Joining Date', 'Basic Salary', 'Status'];
    const rows = activeCompanyStaff.map(s => [
      s.employeeId, s.name, s.designation, s.department || '', s.phone, s.email, s.joiningDate, String(s.basicSalary), s.status
    ]);
    exportToCSV(headers, rows, 'Staff_Master_List.csv');
  };

  const handleExportSalaryReport = () => {
    const headers = ['Employee ID', 'Full Name', 'Basic Salary', 'Housing', 'Transport', 'Food', 'Other', 'Total Salary', 'Bank Name', 'IBAN', 'Method'];
    const rows = activeCompanyStaff.map(s => {
      const total = s.basicSalary + s.housingAllowance + s.transportAllowance + s.foodAllowance + s.otherAllowance;
      return [
        s.employeeId, s.name, String(s.basicSalary), String(s.housingAllowance), String(s.transportAllowance), String(s.foodAllowance), String(s.otherAllowance), String(total), s.bankName || '', s.iban || '', s.paymentMethod
      ];
    });
    exportToCSV(headers, rows, 'Salary_Package_Report.csv');
  };

  // Computed SIF Data for UAE MOHRE WPS direct bank upload
  const sifData = useMemo(() => {
    const targetStaff = activeCompanyStaff.filter(s => {
      if (s.status !== 'Active') return false;
      if (sifFilterPayment === 'bank_only') {
        return s.paymentMethod === 'Bank Transfer';
      }
      return true;
    });

    const rawEmpId = (sifEmployerId.trim() || company?.trn || company?.registrationNumber || '1234567890123').replace(/\D/g, '');
    const empId = rawEmpId ? rawEmpId.padEnd(13, '0').slice(0, 13) : '1234567890123';

    const rawRouting = (sifRoutingCode.trim() || '033999999').replace(/\D/g, '');
    const routing = rawRouting ? rawRouting.padEnd(9, '0').slice(0, 9) : '033999999';

    const today = new Date();
    const creationDate = today.toISOString().split('T')[0];
    const creationTime = today.toTimeString().split(' ')[0].replace(/:/g, '').slice(0, 4);

    const [yearStr, monthStr] = (sifMonthYear || '2026-07').split('-');
    const year = parseInt(yearStr || '2026', 10);
    const month = parseInt(monthStr || '07', 10);

    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${yearStr}-${monthStr}-01`;
    const endDate = `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

    let totalBasic = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const records = targetStaff.map(s => {
      let cardNo = (s.employeeId || '').replace(/\D/g, '');
      if (!cardNo) cardNo = '10000000000000';
      cardNo = cardNo.padStart(14, '0').slice(-14);

      const ibanClean = (s.iban || 'AE000000000000000000000').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const empIban = ibanClean.padEnd(23, '0').slice(0, 23);

      const empBankCode = empIban.length >= 7 ? empIban.slice(4, 7).padEnd(9, '9') : '999999999';

      const basic = s.basicSalary || 0;
      const allowances = (s.housingAllowance || 0) + (s.transportAllowance || 0) + (s.foodAllowance || 0) + (s.otherAllowance || 0);
      const deductions = s.advanceSalaryPending || 0;
      const netPay = Math.max(0, (basic + allowances) - deductions);

      totalBasic += basic;
      totalAllowances += allowances;
      totalDeductions += deductions;
      totalNet += netPay;

      return {
        staff: s,
        cardNo,
        empIban,
        empBankCode,
        startDate,
        endDate,
        daysPaid: 30,
        basic,
        allowances,
        deductions,
        netPay
      };
    });

    const headerLine = `SCR,${empId},${routing},${creationDate},${creationTime},${sifMonthYear.replace('-', '')},${records.length},${totalNet.toFixed(2)},AED,MOHRE_WPS_PAYROLL`;

    const edrLines = records.map(r =>
      `EDR,${r.cardNo},${r.empIban},${r.empBankCode},${r.startDate},${r.endDate},${r.daysPaid},${r.basic.toFixed(2)},${r.allowances.toFixed(2)},${r.deductions.toFixed(2)}`
    );

    const fullSifContent = [headerLine, ...edrLines].join('\r\n');

    return {
      targetStaff,
      empId,
      routing,
      creationDate,
      creationTime,
      sifMonthYear,
      startDate,
      endDate,
      records,
      totalBasic,
      totalAllowances,
      totalDeductions,
      totalNet,
      headerLine,
      fullSifContent
    };
  }, [activeCompanyStaff, sifFilterPayment, sifEmployerId, sifRoutingCode, sifMonthYear, company]);

  const handleExportWpsSif = () => {
    if (!sifEmployerId) {
      const defaultId = (company?.trn || company?.registrationNumber || '1234567890123').replace(/\D/g, '').padEnd(13, '0').slice(0, 13);
      setSifEmployerId(defaultId);
    }
    setIsSifModalOpen(true);
  };

  const handleDownloadSifFile = () => {
    if (sifData.records.length === 0) {
      alert('Error: No active employees match the selected criteria for SIF file export.');
      return;
    }

    const blob = new Blob([sifData.fullSifContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${sifData.empId}_MOHRE_WPS_${sifData.sifMonthYear.replace('-', '')}.sif`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySifText = () => {
    navigator.clipboard.writeText(sifData.fullSifContent);
    setSifCopied(true);
    setTimeout(() => setSifCopied(false), 3000);
  };

  const handleExportExpiryReport = () => {
    const headers = ['Employee ID', 'Full Name', 'EID Expiry', 'Visa Expiry', 'Passport Expiry', 'Contract End', 'Visa Days Left', 'EID Days Left'];
    const rows = activeCompanyStaff.map(s => [
      s.employeeId, s.name, s.eidExpiryDate || '', s.visaExpiryDate || '', s.passportExpiryDate || '', s.contractEndDate || '',
      s.visaExpiryDate ? String(alertDays(s.visaExpiryDate)) : 'N/A', s.eidExpiryDate ? String(alertDays(s.eidExpiryDate)) : 'N/A'
    ]);
    exportToCSV(headers, rows, 'Documents_Expiry_Report.csv');
  };

  const handleExportLeaveReport = () => {
    const headers = ['Employee ID', 'Full Name', 'Total Annual Leaves', 'Leaves Used', 'Leaves Remaining'];
    const rows = activeCompanyStaff.map(s => {
      const total = s.leaveBalanceTotal ?? 30;
      const used = s.leaveBalanceUsed ?? 0;
      return [
        s.employeeId, s.name, String(total), String(used), String(total - used)
      ];
    });
    exportToCSV(headers, rows, 'Leave_Balance_Report.csv');
  };

  // DOCUMENT BUILDERS
  const handlePrintJoiningLetter = (s: Staff) => {
    const letter = (
      <div className="p-8 max-w-2xl mx-auto bg-white text-slate-900 border font-serif" id="joining-letter">
        <div className="border-b-2 border-indigo-900 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-indigo-900">{company?.name || 'GULF EXPORTS LLC'}</h1>
            <p className="text-xs text-slate-500 font-sans">Official Corporate Appointment Letter</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-sans">
            <p>Dubai, United Arab Emirates</p>
            <p>{company?.phone || '+971 4 123 4567'}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <div className="flex justify-between">
            <p><strong>Ref:</strong> {joiningRef}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
          </div>

          <div className="mt-4">
            <p className="font-bold">To,</p>
            <p className="font-bold text-lg">{s.name}</p>
            <p>Employee ID: {s.employeeId}</p>
            <p>{s.address || 'Dubai, UAE'}</p>
          </div>

          <h2 className="text-center text-md font-bold underline my-4">SUBJECT: LETTER OF APPOINTMENT</h2>

          <p>Dear <strong>{s.name}</strong>,</p>
          
          <p>We are pleased to offer you employment with <strong>{company?.name || 'GULF EXPORTS LLC'}</strong> in Dubai, United Arab Emirates, under the following terms and conditions:</p>

          <table className="w-full border-collapse border border-slate-300 text-xs font-sans my-4">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold w-1/3">Designation</td>
                <td className="border border-slate-300 p-2">{s.designation}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Department</td>
                <td className="border border-slate-300 p-2">{s.department || 'Operations'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Date of Joining</td>
                <td className="border border-slate-300 p-2">{new Date(s.joiningDate).toLocaleDateString('en-GB')}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Contract Type</td>
                <td className="border border-slate-300 p-2">{s.contractType || 'Limited'} Contract</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Basic Monthly Salary</td>
                <td className="border border-slate-300 p-2">AED {s.basicSalary.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">Monthly Allowances</td>
                <td className="border border-slate-300 p-2">
                  Housing: AED {s.housingAllowance.toLocaleString()} | Transport: AED {s.transportAllowance.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold">WPS Payment Method</td>
                <td className="border border-slate-300 p-2">{s.paymentMethod}</td>
              </tr>
            </tbody>
          </table>

          <p>This appointment is subject to the labor regulations of the Ministry of Human Resources & Emiratisation (MOHRE) of the United Arab Emirates. You will be eligible for 30 calendar days of paid annual leave per year of service.</p>

          <p>Please sign this letter below as a token of your acceptance of this offer.</p>

          <div className="pt-8 flex justify-between font-sans">
            <div>
              <p className="border-b border-slate-400 w-44 h-12"></p>
              <p className="text-xs font-bold mt-1">For {company?.name || 'GULF EXPORTS LLC'}</p>
              <p className="text-[10px] text-slate-500">Authorized Signatory</p>
            </div>
            <div className="text-right">
              <p className="border-b border-slate-400 w-44 h-12"></p>
              <p className="text-xs font-bold mt-1">Accepted by {s.name}</p>
              <p className="text-[10px] text-slate-500">Employee Signature</p>
            </div>
          </div>
        </div>
      </div>
    );
    setPrintableDoc({ title: `Appointment_Letter_${s.employeeId}`, content: letter });
  };

  const handlePrintCancellationLetter = (s: Staff) => {
    // UAE Law End of service gratuity calculation
    const yearsServed = (new Date().getTime() - new Date(s.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    let gratuity = 0;
    if (calcGratuity && yearsServed >= 1) {
      const basicDaily = s.basicSalary / 30;
      if (yearsServed <= 5) {
        gratuity = basicDaily * 21 * yearsServed;
      } else {
        gratuity = (basicDaily * 21 * 5) + (basicDaily * 30 * (yearsServed - 5));
      }
    }

    const netClearance = s.basicSalary + s.housingAllowance + s.transportAllowance + gratuity - (s.advanceSalaryPending ?? 0);

    const letter = (
      <div className="p-8 max-w-2xl mx-auto bg-white text-slate-900 border font-serif" id="cancellation-letter">
        <div className="border-b-2 border-indigo-900 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-indigo-900">{company?.name || 'GULF EXPORTS LLC'}</h1>
            <p className="text-xs text-slate-500 font-sans">MOHRE UAE - Separation & Gratuity Settlement</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-sans">
            <p>Dubai, UAE</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <div className="flex justify-between font-sans text-xs">
            <p><strong>Settlement Code:</strong> SETL-{s.employeeId}</p>
            <p><strong>Execution Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
          </div>

          <h2 className="text-center text-md font-bold underline my-4">FULL AND FINAL CLEARANCE SHEET</h2>

          <p>This is to certify that the employment contract of the employee listed below has been officially terminated/resigned, and all pending dues have been settled as per the UAE MOHRE Labour Law:</p>

          <div className="bg-slate-50 p-3 rounded border font-sans text-xs grid grid-cols-2 gap-2 my-3">
            <p><strong>Employee Name:</strong> {s.name}</p>
            <p><strong>Designation:</strong> {s.designation}</p>
            <p><strong>Date of Joining:</strong> {new Date(s.joiningDate).toLocaleDateString('en-GB')}</p>
            <p><strong>Termination Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
            <p><strong>Total Service Period:</strong> {(yearsServed).toFixed(2)} Years</p>
            <p><strong>Separation Reason:</strong> {cancellationReason}</p>
          </div>

          <h3 className="font-sans font-bold text-xs uppercase text-indigo-900 border-b pb-1 mt-4">FINANCIAL BREAKDOWN (AED)</h3>
          
          <table className="w-full border-collapse border border-slate-300 text-xs font-sans my-2">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 text-left">Description</th>
                <th className="border border-slate-300 p-2 text-right">Dues / Credit</th>
                <th className="border border-slate-300 p-2 text-right">Deductions / Debit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2">Final Month Base Salary & Allowances</td>
                <td className="border border-slate-300 p-2 text-right">AED {(s.basicSalary + s.housingAllowance + s.transportAllowance).toLocaleString()}</td>
                <td className="border border-slate-300 p-2 text-right">-</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2">UAE End of Service Gratuity (MOHRE Law)</td>
                <td className="border border-slate-300 p-2 text-right">AED {(gratuity).toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                <td className="border border-slate-300 p-2 text-right">-</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-red-600 font-bold">Outstanding Salary Advance Balance</td>
                <td className="border border-slate-300 p-2 text-right">-</td>
                <td className="border border-slate-300 p-2 text-right text-rose-600">AED {(s.advanceSalaryPending ?? 0).toLocaleString()}</td>
              </tr>
              <tr className="bg-emerald-50 font-bold text-emerald-800">
                <td className="border border-slate-300 p-2 text-left">NET PAYABLE AMOUNT</td>
                <td className="border border-slate-300 p-2 text-right" colSpan={2}>
                  AED {(netClearance).toLocaleString(undefined, {maximumFractionDigits: 2})}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-slate-500 italic mt-4">
            Declaration: I hereby declare that I have received all my dues, allowances, and gratuity from {company?.name || 'GULF EXPORTS LLC'} and have no further claims of any nature whatsoever against the company.
          </p>

          <div className="pt-8 flex justify-between font-sans">
            <div>
              <p className="border-b border-slate-400 w-44 h-12"></p>
              <p className="text-xs font-bold mt-1">Finance Director</p>
            </div>
            <div className="text-right">
              <p className="border-b border-slate-400 w-44 h-12"></p>
              <p className="text-xs font-bold mt-1">Employee Signature</p>
            </div>
          </div>
        </div>
      </div>
    );
    setPrintableDoc({ title: `Separation_Settlement_${s.employeeId}`, content: letter });
  };

  const handlePrintServiceCertificate = (s: Staff) => {
    const letter = (
      <div className="p-12 max-w-2xl mx-auto bg-slate-50 text-slate-900 border-8 border-indigo-950 font-serif text-center relative" id="service-certificate">
        <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-indigo-900 pointer-events-none p-6"></div>
        
        <div className="pt-6">
          <Building className="w-16 h-16 mx-auto text-indigo-900 mb-2" />
          <h1 className="text-3xl font-extrabold uppercase tracking-widest text-indigo-950">{company?.name || 'GULF EXPORTS LLC'}</h1>
          <p className="text-xs uppercase tracking-widest text-slate-500">Corporate HR Services UAE</p>
        </div>

        <div className="my-10 space-y-4">
          <h2 className="text-4xl font-semibold font-serif italic text-amber-700">Certificate of Service</h2>
          <p className="text-sm font-sans tracking-wide uppercase text-slate-600 mt-2">This is proudly awarded to</p>
          <p className="text-3xl font-bold font-serif underline decoration-amber-600 underline-offset-8 my-4">{s.name}</p>
          <p className="text-sm leading-relaxed max-w-lg mx-auto font-sans text-slate-700">
            in recognition and sincere appreciation of his dedicated service as <strong className="text-indigo-950">{s.designation}</strong> in the <strong className="text-indigo-950">{s.department || 'Operations'} Department</strong>. He was employed with us from <strong className="text-indigo-950">{new Date(s.joiningDate).toLocaleDateString('en-GB')}</strong> until <strong className="text-indigo-950">{new Date().toLocaleDateString('en-GB')}</strong>.
          </p>
          <p className="text-xs leading-relaxed max-w-md mx-auto text-slate-500 italic mt-4 font-sans">
            During his tenure with us, Ahmed proved to be a highly industrious, honest, and professional member of our organization. We wish him the absolute best in all his future personal and professional endeavors.
          </p>
        </div>

        <div className="pt-8 flex justify-around font-sans text-xs text-slate-600">
          <div>
            <p className="border-b border-slate-400 w-36 mx-auto h-8"></p>
            <p className="font-bold mt-1 text-slate-800">Director of Human Resources</p>
            <p className="text-[10px] text-slate-400">{company?.name || 'GULF EXPORTS LLC'}</p>
          </div>
          <div>
            <p className="border-b border-slate-400 w-36 mx-auto h-8"></p>
            <p className="font-bold mt-1 text-slate-800">Company Registrar</p>
            <p className="text-[10px] text-slate-400">Government of Dubai, UAE</p>
          </div>
        </div>
      </div>
    );
    setPrintableDoc({ title: `Service_Certificate_${s.employeeId}`, content: letter });
  };

  const handlePrintBlankJoiningForm = (s?: Staff) => {
    const form = (
      <div className="p-8 max-w-3xl mx-auto bg-white text-slate-900 border font-sans" id="printable-joining-form">
        <div className="border-b-2 border-indigo-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-indigo-900">{company?.name || 'GULF EXPORTS LLC'}</h1>
            <p className="text-xs text-slate-700 font-bold mt-0.5">EMPLOYEE JOINING & ONBOARDING FORM</p>
            <p className="text-[10px] text-slate-500 mt-1">TRN: {company?.trn || '100XXXXXXXXX003'} | {company?.address || 'Dubai, United Arab Emirates'}</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <p className="font-bold text-indigo-900">FORM REF: STF-JNF-2026</p>
            <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
            <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[9px] font-bold uppercase rounded">
              Physical Print & Sign Copy
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mb-4 italic bg-slate-50 p-2 rounded border border-slate-200">
          * Employee Instructions: Complete all fields below in capital letters. Attach passport copy, visa page, Emirates ID copy, and physical IBAN letter before returning to HR for signature and filing.
        </p>

        {/* SECTION 1 */}
        <div className="mb-5 space-y-2">
          <h3 className="font-bold text-indigo-900 border-b pb-1 text-xs uppercase tracking-wider flex justify-between">
            <span>SECTION 1: PERSONAL PARTICULARS</span>
            <span className="text-[10px] text-slate-400 font-normal">Step 1 of 4</span>
          </h3>
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold w-1/4 bg-slate-50">Full Name (As in Passport)</td>
                <td className="border border-slate-300 p-2 font-bold" colSpan={3}>{s?.name || '____________________________________________________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Gender</td>
                <td className="border border-slate-300 p-2">{s?.gender || '[  ] Male   [  ] Female'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Date of Birth</td>
                <td className="border border-slate-300 p-2">{s?.dob || '____ / ____ / ________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Nationality</td>
                <td className="border border-slate-300 p-2">{s?.nationality || '______________________'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Religion</td>
                <td className="border border-slate-300 p-2">{s?.religion || '______________________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Phone Number</td>
                <td className="border border-slate-300 p-2">{s?.phone || '______________________'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Email Address</td>
                <td className="border border-slate-300 p-2">{s?.email || '______________________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Passport Number</td>
                <td className="border border-slate-300 p-2">{s ? 'Attached on file' : '______________________'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Emirates ID No</td>
                <td className="border border-slate-300 p-2">{s ? '784-XXXX-XXXXXXX-X' : '784-________________-____'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Emergency Contact Person</td>
                <td className="border border-slate-300 p-2">{s?.emergencyName || '______________________'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Emergency Phone</td>
                <td className="border border-slate-300 p-2">{s?.emergencyPhone || '______________________'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 2 */}
        <div className="mb-5 space-y-2">
          <h3 className="font-bold text-indigo-900 border-b pb-1 text-xs uppercase tracking-wider flex justify-between">
            <span>SECTION 2: WORK ASSIGNMENT, SHIFT & WORKING HOURS</span>
            <span className="text-[10px] text-slate-400 font-normal">Step 2 of 4</span>
          </h3>
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold w-1/4 bg-slate-50">Designation / Role</td>
                <td className="border border-slate-300 p-2 font-bold">{s?.designation || '______________________'}</td>
                <td className="border border-slate-300 p-2 font-bold w-1/4 bg-slate-50">Department</td>
                <td className="border border-slate-300 p-2">{s?.department || '______________________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Date of Joining</td>
                <td className="border border-slate-300 p-2">{s ? new Date(s.joiningDate).toLocaleDateString('en-GB') : '____ / ____ / ________'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Contract Type</td>
                <td className="border border-slate-300 p-2">[  ] Limited   [  ] Unlimited</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Assigned Shift & Break</td>
                <td className="border border-slate-300 p-2" colSpan={3}>
                  <div className="space-y-1 text-[11px]">
                    <p><strong>[  ] Day Shift:</strong> {company?.dayShiftStart || '08:00'} to {company?.dayShiftEnd || '17:00'} (Duration: 9 hrs total including {company?.dayShiftBreakMins || 60} mins break)</p>
                    <p><strong>[  ] Night Shift:</strong> {company?.nightShiftStart || '20:00'} to {company?.nightShiftEnd || '05:00'} (Duration: 9 hrs total including {company?.nightShiftBreakMins || 60} mins break)</p>
                    <p><strong>[  ] Evening Shift:</strong> Flexi Rotational</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 3 */}
        <div className="mb-5 space-y-2">
          <h3 className="font-bold text-indigo-900 border-b pb-1 text-xs uppercase tracking-wider flex justify-between">
            <span>SECTION 3: COMPENSATION PACKAGE & WPS BANK IBAN</span>
            <span className="text-[10px] text-slate-400 font-normal">Step 3 of 4</span>
          </h3>
          <table className="w-full border-collapse border border-slate-300 text-xs font-mono">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold w-1/4 bg-slate-50 font-sans">Basic Monthly Salary</td>
                <td className="border border-slate-300 p-2">AED {s?.basicSalary ? s.basicSalary.toLocaleString() : '________'}</td>
                <td className="border border-slate-300 p-2 font-bold w-1/4 bg-slate-50 font-sans">Housing Allowance</td>
                <td className="border border-slate-300 p-2">AED {s?.housingAllowance ? s.housingAllowance.toLocaleString() : '________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50 font-sans">Transport Allowance</td>
                <td className="border border-slate-300 p-2">AED {s?.transportAllowance ? s.transportAllowance.toLocaleString() : '________'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50 font-sans">Total Gross Salary</td>
                <td className="border border-slate-300 p-2 font-bold text-indigo-900">AED {s ? (s.basicSalary + s.housingAllowance + s.transportAllowance + (s.foodAllowance||0) + (s.otherAllowance||0)).toLocaleString() : '________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50 font-sans">Bank Name</td>
                <td className="border border-slate-300 p-2 font-sans">{s?.bankName || '______________________'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50 font-sans">WPS IBAN Number</td>
                <td className="border border-slate-300 p-2">{s?.iban || 'AE____________________________________'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 4 */}
        <div className="mb-4 space-y-3">
          <h3 className="font-bold text-indigo-900 border-b pb-1 text-xs uppercase tracking-wider flex justify-between">
            <span>SECTION 4: UNDERTAKING & PHYSICAL SIGNATURES</span>
            <span className="text-[10px] text-slate-400 font-normal">Step 4 of 4</span>
          </h3>
          <p className="text-[10px] text-slate-600 leading-relaxed border p-2.5 bg-slate-50 rounded">
            I hereby confirm that the information given above is accurate and complete. I undertake to comply with all rules, safety guidelines, working hours, shift timings, and regulations of the company and the United Arab Emirates Ministry of Human Resources & Emiratisation (MOHRE).
          </p>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="border p-4 rounded text-center space-y-6">
              <p className="text-[10px] uppercase font-bold text-slate-600">Employee Signature & Date</p>
              <div className="h-12 border-b border-dashed border-slate-400"></div>
              <p className="text-[9px] text-slate-400">Sign physically above</p>
            </div>

            <div className="border p-4 rounded text-center space-y-6">
              <p className="text-[10px] uppercase font-bold text-indigo-900">HR Director Approval & Official Stamp</p>
              <div className="h-12 border-b border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-300 uppercase">
                [ Official Company Stamp Here ]
              </div>
              <p className="text-[9px] text-slate-400">Approved & Accepted</p>
            </div>
          </div>
        </div>
      </div>
    );
    setPrintableDoc({ title: `Employee_Joining_Form_${s ? s.employeeId : 'Blank'}`, content: form });
  };

  const handlePrintBlankLeaveForm = (s?: Staff) => {
    const form = (
      <div className="p-8 max-w-3xl mx-auto bg-white text-slate-900 border font-sans" id="printable-leave-form">
        <div className="border-b-2 border-indigo-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-indigo-900">{company?.name || 'GULF EXPORTS LLC'}</h1>
            <p className="text-xs text-slate-700 font-bold mt-0.5">EMPLOYEE LEAVE REQUEST & DEDUCTION AUTHORIZATION</p>
            <p className="text-[10px] text-slate-500 mt-1">TRN: {company?.trn || '100XXXXXXXXX003'} | Ref: LV-FORM-2026</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold uppercase rounded">
              Leave Ledger Document
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <table className="w-full border-collapse border border-slate-300">
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold w-1/4 bg-slate-50">Employee Name</td>
                <td className="border border-slate-300 p-2 font-bold">{s?.name || '_____________________________________'}</td>
                <td className="border border-slate-300 p-2 font-bold w-1/4 bg-slate-50">Employee ID</td>
                <td className="border border-slate-300 p-2">{s?.employeeId || '___________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Designation / Dept</td>
                <td className="border border-slate-300 p-2">{s ? `${s.designation} (${s.department || 'Operations'})` : '_____________________________________'}</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Contact Phone</td>
                <td className="border border-slate-300 p-2">{s?.phone || '___________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Leave Type Requested</td>
                <td className="border border-slate-300 p-2" colSpan={3}>
                  <div className="grid grid-cols-3 gap-2">
                    <span>[  ] Unpaid Leave (Salary Deduction)</span>
                    <span>[  ] Sick Leave (Medical Note)</span>
                    <span>[  ] Annual Paid Leave</span>
                    <span>[  ] Maternity / Paternity</span>
                    <span>[  ] Emergency Leave</span>
                    <span>[  ] Other Special Leave</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Leave Start Date</td>
                <td className="border border-slate-300 p-2">____ / ____ / ________</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Leave End Date</td>
                <td className="border border-slate-300 p-2">____ / ____ / ________</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Total Requested Days</td>
                <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-900">______ Calendar Days</td>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Resumption Duty Date</td>
                <td className="border border-slate-300 p-2">____ / ____ / ________</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Reason / Details</td>
                <td className="border border-slate-300 p-2" colSpan={3}>____________________________________________________________________________________</td>
              </tr>
            </tbody>
          </table>

          <div className="border p-3 bg-amber-50 rounded border-amber-200 text-amber-900 space-y-1">
            <p className="font-bold">⚠️ Salary Deduction Policy for Unpaid Leave:</p>
            <p className="text-[10px] leading-relaxed">
              If leave is categorized as <strong>Unpaid Leave</strong>, salary deduction will be applied on the monthly WPS payslip according to company policy:
              <br />
              <strong className="font-mono">Daily Rate = Total Monthly Gross / {company?.salaryCalculationBasis === '31_fixed' ? '31 Days' : company?.salaryCalculationBasis === 'actual_month_days' ? 'Actual Calendar Month Days' : '30 Days (Standard UAE MOHRE)'}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6">
            <div className="border p-4 rounded text-center space-y-6">
              <p className="font-bold text-slate-700">Applicant Employee Signature</p>
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <p className="text-[10px] text-slate-400">Sign & Date</p>
            </div>
            <div className="border p-4 rounded text-center space-y-6">
              <p className="font-bold text-indigo-900">Computer Operator / Admin Approval</p>
              <div className="h-10 border-b border-dashed border-slate-400"></div>
              <p className="text-[10px] text-slate-400">[ Approved / Rejected ] Signature & Stamp</p>
            </div>
          </div>
        </div>
      </div>
    );
    setPrintableDoc({ title: `Leave_Application_Form_${s ? s.employeeId : 'Blank'}`, content: form });
  };

  const handlePrintPayslip = (s: Staff, slip: SalarySlip) => {
    const totalAllowances = (slip.housingAllowance || 0) + (slip.transportAllowance || 0) + (slip.foodAllowance || 0) + (slip.otherAllowance || 0);
    const calculatedEarnings = totalAllowances > 0 ? totalAllowances : (slip.basicSalary + slip.housingAllowance + slip.transportAllowance + slip.foodAllowance + slip.otherAllowance + slip.overtimePay);
    const netSalary = calculatedEarnings - (slip.deductions || 0);
    const slipNumber = `SLP-${s.employeeId}-${(slip.monthYear || 'PAYSLIP').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
    const wordsObj = convertAmountToBilingualWords(netSalary);

    const slipLetter = (
      <div className="p-8 max-w-2xl mx-auto bg-white text-slate-900 border border-slate-200 font-sans shadow-xs" id="salary-slip">
        {/* Header Block with Logo/Company Name and Barcode */}
        <div className="border-b-2 border-indigo-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase text-indigo-950 tracking-tight">{company?.name || 'GULF EXPORTS LLC'}</h1>
            <p className="text-xs text-slate-600 font-medium">MOHRE Wages Protection System (WPS) Payslip</p>
            <p className="text-[10px] text-slate-500 mt-1">Bank Name: <strong>{s.bankName || 'UAE Local Bank'}</strong> | IBAN: <strong className="font-mono">{s.iban || 'N/A'}</strong></p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="bg-indigo-100 text-indigo-900 font-extrabold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider mb-2">WPS Paid Verified</span>
            <div className="p-1 bg-white border border-slate-200 rounded shadow-2xs mb-1">
              <Barcode value={slipNumber} />
            </div>
            <p className="text-[10px] font-mono font-bold text-slate-700">Slip No: {slipNumber}</p>
          </div>
        </div>

        {/* Employee & Payment Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Employee Details</p>
            <p className="font-extrabold text-sm text-slate-900 mt-0.5">{s.name}</p>
            <p className="text-slate-700">ID: <strong className="font-mono">{s.employeeId}</strong> | {s.designation}</p>
            <p className="text-slate-600">Dept: {s.department || 'Operations'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Payment Details</p>
            <p className="text-slate-800 mt-0.5"><strong>Pay Period:</strong> {slip.monthYear}</p>
            <p className="text-slate-800"><strong>Payment Date:</strong> {new Date(slip.paymentDate).toLocaleDateString('en-GB')}</p>
            <p className="text-slate-800"><strong>Payment Method:</strong> {slip.paymentMethod}</p>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <h3 className="font-extrabold text-indigo-900 border-b border-indigo-100 pb-1.5 mb-2.5 uppercase text-[10px] tracking-wider font-mono">
              Allowances & Earnings (AED)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Housing Allowance:</span> 
                <span className="font-mono font-bold text-slate-900">AED {(slip.housingAllowance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Transport Allowance:</span> 
                <span className="font-mono font-bold text-slate-900">AED {(slip.transportAllowance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Food Allowance:</span> 
                <span className="font-mono font-bold text-slate-900">AED {(slip.foodAllowance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Other Allowance:</span> 
                <span className="font-mono font-bold text-slate-900">AED {(slip.otherAllowance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-slate-900 text-xs">
                <span>Gross Earnings:</span> 
                <span className="font-mono">AED {calculatedEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-extrabold text-rose-800 border-b border-rose-100 pb-1.5 mb-2.5 uppercase text-[10px] tracking-wider font-mono">
              Deductions (AED)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-slate-700">
                <span>Unexcused Absences:</span> 
                <span className="font-mono">AED 0.00</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Salary Advance Deductions:</span> 
                <span className="font-mono text-rose-800 font-bold">AED {(slip.deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Other Penalties:</span> 
                <span className="font-mono">AED 0.00</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-rose-800 text-xs">
                <span>Total Deductions:</span> 
                <span className="font-mono">AED {(slip.deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Take-Home Pay Box with English Amount in Words */}
        <div className="border-2 border-indigo-900 mt-6 p-4 rounded-xl bg-indigo-50/60 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-black text-indigo-900 font-mono tracking-wider">Net Take-Home Pay</p>
              <p className="text-2xl font-black text-indigo-950 font-mono">
                AED {netSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-600 leading-relaxed font-sans">
              <p className="font-bold text-slate-800">Authorized WPS Stamp</p>
              <p>Ministry of Human Resources & Emiratisation UAE</p>
            </div>
          </div>
          <div className="border-t border-indigo-200 pt-2 text-left">
            <p className="text-[10px] font-extrabold uppercase font-mono text-indigo-900 tracking-wider">Total Amount in Words (English):</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5">{wordsObj.english}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-8 pt-8 border-t border-slate-200 flex justify-between text-[11px] text-slate-600">
          <div>
            {slip.preparedBy && <p className="font-bold text-slate-900 mb-1">Prepared By: {slip.preparedBy}</p>}
            <p className="font-medium">Employer Signature & Stamp</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Employee Signature & Date</p>
          </div>
        </div>
      </div>
    );
    setPrintableDoc({ title: `Payslip_${s.employeeId}_${slip.monthYear.replace(' ', '_')}`, content: slipLetter });
  };

  const handlePrint = () => {
    triggerPrint('staff-printable-doc');
  };

  return (
    <div className="space-y-6">
      {/* Printable Area Wrapper for Overlays */}
      {printableDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-xl shadow-2xl p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-bold text-slate-800 text-sm">Preview Document: {printableDoc.title}</h3>
              <div className="flex space-x-2">
                <button onClick={handlePrint} className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer transition">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PDF</span>
                </button>
                <button onClick={() => setPrintableDoc(null)} className="flex items-center space-x-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold cursor-pointer transition">
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>
            <div id="staff-printable-doc" className="p-2 bg-slate-100 rounded-lg">
              {printableDoc.content}
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable container for actual native print window layout */}
      <div className="hidden print:block absolute top-0 left-0 right-0 bg-white min-h-screen text-black">
        {printableDoc?.content}
      </div>

      {/* Header Widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border dark:border-slate-800 shadow-xs no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Staff Master & HR Document Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">A-Z personnel directory, MOHRE legal compliance exiries, automated letter builders & salary payroll metrics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleLoadDemoStaff} className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs">
            <Users className="w-4 h-4" />
            <span>Load Sample UAE Staff</span>
          </button>

          <button onClick={handleAddNew} className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer">
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Staff</span>
          </button>

          {/* Printable Forms Menu Dropdown */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer">
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Print Blank Forms</span>
            </button>
            <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-xl hidden group-hover:block z-20 p-1">
              <button onClick={() => handlePrintBlankJoiningForm()} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="font-bold">Blank Joining & Onboarding Form</p>
                  <p className="text-[9px] text-slate-400">For physical employee signature</p>
                </div>
              </button>
              <button onClick={() => handlePrintBlankLeaveForm()} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="font-bold">Blank Leave Application Form</p>
                  <p className="text-[9px] text-slate-400">For leave requests & salary deduction</p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Export Reports Bento-Menu Dropdown */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer">
              <Download className="w-4 h-4" />
              <span>Export Compliance Excel</span>
            </button>
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg shadow-xl hidden group-hover:block z-10 p-1">
              <button onClick={handleExportStaffList} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded flex items-center space-x-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>Full Staff Register</span>
              </button>
              <button onClick={handleExportSalaryReport} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded flex items-center space-x-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>WPS Salaries Report</span>
              </button>
              <button onClick={handleExportWpsSif} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded flex items-center space-x-2 border-b border-dashed border-slate-200 dark:border-slate-800 bg-emerald-50/20 dark:bg-emerald-950/20">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Export MOHRE .SIF File</span>
              </button>
              <button onClick={handleExportExpiryReport} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Visa/EID Expiries</span>
              </button>
              <button onClick={handleExportLeaveReport} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Leaves Balances</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- PAYROLL & WORKFORCE ANALYTICS DASHBOARD ----------------- */}
      {showAnalytics && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-5 shadow-xs space-y-6 no-print">
          {/* Header of Analytics */}
          <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-950 dark:text-white uppercase tracking-wider">Workforce Payroll & WPS Analytics Hub</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Real-time basic salary vs allowances parity, dynamic advance loan deductions, and 6-month WPS cashflow forecast.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleExportWpsSif}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Export .SIF File</span>
              </button>
              <button 
                onClick={() => setShowAnalytics(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center space-x-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Minimize</span>
              </button>
            </div>
          </div>

          {activeStaffOnly.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-xl border-2 border-dashed dark:border-slate-850">
              <Users className="w-8 h-8 mx-auto text-slate-400 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Active Employees for Payroll Analytics</p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1">Onboard staff members and mark their status as 'Active' to generate comprehensive cashflow forecasts and allowance breakdown charts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel: Primary Stats cards */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Stat 1: Total Payroll Costs */}
                <div className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 p-4 rounded-xl relative overflow-hidden group">
                  <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition text-indigo-600">
                    <DollarSign className="w-12 h-12" />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-indigo-600 dark:text-indigo-400">Total Monthly Payroll Cost</span>
                  <p className="text-2xl font-black text-slate-950 dark:text-white font-mono mt-1">{formatAED(totalMonthlyPayroll)}</p>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 border-t dark:border-slate-800/60 pt-2.5">
                    <span>Active Workforce: <strong>{activeStaffOnly.length} Staff</strong></span>
                    <span>Average: <strong>{formatAED(totalMonthlyPayroll / activeStaffOnly.length)}</strong></span>
                  </div>
                </div>

                {/* Stat 2: Basic vs Allowances Breakdown bar */}
                <div className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 p-4 rounded-xl space-y-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-indigo-600 dark:text-indigo-400">Salary Structure Composition</span>
                    <p className="text-xs text-slate-400 mt-0.5">Parity between Basic Salary and Allowances</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${(totalBasicSalary / totalMonthlyPayroll) * 100}%` }} 
                        className="bg-indigo-600 h-full hover:opacity-90 transition-all cursor-pointer"
                        title={`Basic Salary: ${formatAED(totalBasicSalary)}`}
                      ></div>
                      <div 
                        style={{ width: `${(allowancesBreakdown.total / totalMonthlyPayroll) * 100}%` }} 
                        className="bg-emerald-500 h-full hover:opacity-90 transition-all cursor-pointer"
                        title={`Allowances: ${formatAED(allowancesBreakdown.total)}`}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-full mr-1"></span>Basic: {((totalBasicSalary / totalMonthlyPayroll) * 100).toFixed(0)}%</span>
                      <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1"></span>Allowances: {((allowancesBreakdown.total / totalMonthlyPayroll) * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Sub breakdown of allowances */}
                  <div className="border-t dark:border-slate-800/60 pt-3 space-y-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Basic Monthly Total:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatAED(totalBasicSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Allowances Monthly Total:</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatAED(allowancesBreakdown.total)}</span>
                    </div>
                    {totalAdvanceDeductions > 0 && (
                      <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 border-t dark:border-slate-800/65 pt-2">
                        <span>Advance Loan Deductions:</span>
                        <span className="font-bold font-mono">-{formatAED(totalAdvanceDeductions)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Panel: Breakdown of Allowances list */}
              <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-indigo-600 dark:text-indigo-400">Allowances Component Audit</span>
                  <p className="text-xs text-slate-400 mt-0.5">WPS allowance category breakdown</p>
                </div>

                <div className="space-y-3.5 my-3">
                  {/* Housing Allowance */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Housing Allowance</span>
                      <span className="font-mono">{formatAED(allowancesBreakdown.housing)} ({allowancesBreakdown.total > 0 ? ((allowancesBreakdown.housing / allowancesBreakdown.total) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: allowancesBreakdown.total > 0 ? `${(allowancesBreakdown.housing / allowancesBreakdown.total) * 100}%` : '0%' }} className="bg-sky-500 h-full rounded-full"></div>
                    </div>
                  </div>

                  {/* Transport Allowance */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Transport Allowance</span>
                      <span className="font-mono">{formatAED(allowancesBreakdown.transport)} ({allowancesBreakdown.total > 0 ? ((allowancesBreakdown.transport / allowancesBreakdown.total) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: allowancesBreakdown.total > 0 ? `${(allowancesBreakdown.transport / allowancesBreakdown.total) * 100}%` : '0%' }} className="bg-amber-500 h-full rounded-full"></div>
                    </div>
                  </div>

                  {/* Food Allowance */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Food Allowance</span>
                      <span className="font-mono">{formatAED(allowancesBreakdown.food)} ({allowancesBreakdown.total > 0 ? ((allowancesBreakdown.food / allowancesBreakdown.total) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: allowancesBreakdown.total > 0 ? `${(allowancesBreakdown.food / allowancesBreakdown.total) * 100}%` : '0%' }} className="bg-rose-500 h-full rounded-full"></div>
                    </div>
                  </div>

                  {/* Other Allowances */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Other Allowance</span>
                      <span className="font-mono">{formatAED(allowancesBreakdown.other)} ({allowancesBreakdown.total > 0 ? ((allowancesBreakdown.other / allowancesBreakdown.total) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: allowancesBreakdown.total > 0 ? `${(allowancesBreakdown.other / allowancesBreakdown.total) * 100}%` : '0%' }} className="bg-violet-500 h-full rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100/55 dark:border-indigo-900/40 p-2 rounded-lg text-[10px] text-indigo-700 dark:text-indigo-400 leading-relaxed font-sans mt-1">
                  💡 <strong>WPS Audit Check:</strong> A balanced ratio of basic salary to allowances is required for optimal UAE end-of-service gratuity calculations under Federal Decree-Law No. 33 of 2021.
                </div>
              </div>

              {/* Right Panel: Graphical projection of upcoming salary payments for next 6 months */}
              <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 p-4 rounded-xl flex flex-col justify-between relative">
                <div className="space-y-1 mb-2">
                  <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-indigo-600 dark:text-indigo-400">6-Month Cashflow Salary Projection</span>
                  <p className="text-xs text-slate-400 mt-0.5">WPS Net Payable Projection (incorporating loan schedules)</p>
                </div>

                {/* Pure Interactive Responsive SVG Chart */}
                <div className="relative w-full h-[150px] mt-2 flex items-center justify-center">
                  {(() => {
                    // SVG Size
                    const svgW = 340;
                    const svgH = 130;
                    
                    // Chart constraints
                    const chartLeft = 35;
                    const chartRight = svgW - 10;
                    const chartTop = 15;
                    const chartBottom = svgH - 20;
                    const chartW = chartRight - chartLeft;
                    const chartH = chartBottom - chartTop;

                    // Get max value to scale properly
                    const maxProjVal = Math.max(...projectionData.map(d => d.gross), 1000);
                    // Nice maximum ceiling multiple of 5000
                    const scaleMax = Math.ceil(maxProjVal / 5000) * 5000 || 5000;

                    // Compute points
                    const points = projectionData.map((d, idx) => {
                      const x = chartLeft + (idx * (chartW / 5));
                      // Y axis goes from top down
                      const yGross = chartBottom - ((d.gross / scaleMax) * chartH);
                      const yNet = chartBottom - ((d.net / scaleMax) * chartH);
                      return { x, yGross, yNet, ...d };
                    });

                    // Generate thick path for Net line
                    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.yNet}`).join(' ');

                    return (
                      <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} className="overflow-visible">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                          const y = chartBottom - (ratio * chartH);
                          const val = scaleMax * ratio;
                          return (
                            <g key={i}>
                              <line 
                                x1={chartLeft} 
                                y1={y} 
                                x2={chartRight} 
                                y2={y} 
                                stroke="#cbd5e1" 
                                strokeWidth="0.5" 
                                strokeDasharray="3,3" 
                                className="dark:stroke-slate-800"
                              />
                              <text 
                                x={chartLeft - 5} 
                                y={y + 3} 
                                textAnchor="end" 
                                className="fill-slate-400 text-[8px] font-mono"
                              >
                                {val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                              </text>
                            </g>
                          );
                        })}

                        {/* Bars for Gross Salaries */}
                        {points.map((p, idx) => {
                          const barW = 16;
                          const barX = p.x - (barW / 2);
                          const barH = chartBottom - p.yGross;
                          const active = hoveredProjIndex === idx;

                          return (
                            <g key={idx}>
                              <rect 
                                x={barX} 
                                y={p.yGross} 
                                width={barW} 
                                height={barH} 
                                rx="2" 
                                fill={active ? '#a5b4fc' : '#e0e7ff'} 
                                className="dark:fill-slate-800 dark:hover:fill-indigo-900/60 transition cursor-pointer"
                                onMouseEnter={() => setHoveredProjIndex(idx)}
                                onMouseLeave={() => setHoveredProjIndex(null)}
                              />
                              {/* Deduction block on top of bar if exists */}
                              {p.deductions > 0 && (
                                <rect 
                                  x={barX} 
                                  y={p.yGross} 
                                  width={barW} 
                                  height={(p.deductions / scaleMax) * chartH} 
                                  rx="1" 
                                  fill="#fca5a5" 
                                  className="dark:fill-rose-950/80"
                                />
                              )}
                            </g>
                          );
                        })}

                        {/* Net WPS line graph */}
                        <path 
                          d={linePath} 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />

                        {/* Highlight circles on Line graph */}
                        {points.map((p, idx) => {
                          const active = hoveredProjIndex === idx;
                          return (
                            <circle 
                              key={idx}
                              cx={p.x}
                              cy={p.yNet}
                              r={active ? 5 : 3.5}
                              fill={active ? '#047857' : '#10b981'}
                              stroke="white"
                              strokeWidth="1.5"
                              className="cursor-pointer transition-all"
                              onMouseEnter={() => setHoveredProjIndex(idx)}
                              onMouseLeave={() => setHoveredProjIndex(null)}
                            />
                          );
                        })}

                        {/* X Axis labels */}
                        {points.map((p, idx) => (
                          <text 
                            key={idx}
                            x={p.x}
                            y={svgH - 5}
                            textAnchor="middle"
                            className="fill-slate-500 font-bold font-mono text-[8px] dark:fill-slate-400"
                          >
                            {p.name}
                          </text>
                        ))}
                      </svg>
                    );
                  })()}

                  {/* HTML Hover Tooltip directly integrated into canvas box */}
                  {hoveredProjIndex !== null && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 backdrop-blur-xs text-white p-2.5 rounded-lg border border-slate-800 shadow-xl text-[10px] space-y-1 pointer-events-none min-w-[150px] font-mono z-10">
                      <p className="font-sans font-bold text-indigo-400 border-b border-slate-800 pb-1 mb-1">{projectionData[hoveredProjIndex].monthLabel}</p>
                      <div className="flex justify-between">
                        <span>Gross Salary:</span>
                        <span className="font-bold">{formatAED(projectionData[hoveredProjIndex].gross)}</span>
                      </div>
                      {projectionData[hoveredProjIndex].deductions > 0 && (
                        <div className="flex justify-between text-rose-400">
                          <span>Deductions:</span>
                          <span className="font-bold">-{formatAED(projectionData[hoveredProjIndex].deductions)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-emerald-400 border-t border-slate-800 pt-1 mt-0.5">
                        <span>Net WPS Pay:</span>
                        <span className="font-bold">{formatAED(projectionData[hoveredProjIndex].net)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Small indicator legend */}
                <div className="flex justify-center space-x-4 text-[9px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center"><span className="w-2.5 h-1 bg-[#e0e7ff] dark:bg-slate-800 mr-1 rounded"></span>Gross Monthly</span>
                  <span className="flex items-center"><span className="w-2.5 h-1 bg-[#fca5a5] dark:bg-rose-950 mr-1 rounded"></span>Advance Deduct</span>
                  <span className="flex items-center"><span className="w-2.5 h-0.5 bg-[#10b981] mr-1"></span>Net WPS Outflow</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle dashboard visibility when minimized */}
      {!showAnalytics && (
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 border dark:border-slate-800 p-3.5 rounded-xl shadow-xs no-print">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">WPS Workforce Payroll Dashboard is currently minimized</span>
          </div>
          <button 
            onClick={() => setShowAnalytics(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Maximize Dashboard View</span>
          </button>
        </div>
      )}

      {/* MOHRE & Residency Renewal Notice Modal Overlay */}
      {showExpiryNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-xl w-full border dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-start border-b dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">MOHRE & Visa Renewal Notice</h3>
                  <p className="text-xs text-slate-500 font-mono">STF ID: {showExpiryNoticeModal.employeeId} • {showExpiryNoticeModal.name}</p>
                </div>
              </div>
              <button onClick={() => setShowExpiryNoticeModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-800 space-y-2 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {`OFFICIAL UAE MOHRE & RESIDENCY RENEWAL NOTICE
---------------------------------------------
Company: ${company?.name || 'Company'}
To: ${showExpiryNoticeModal.name} (${showExpiryNoticeModal.employeeId})
Department: ${showExpiryNoticeModal.department || 'Operations'} | Designation: ${showExpiryNoticeModal.designation}

Dear ${showExpiryNoticeModal.name},

Please be advised that your official UAE documents under ${company?.name || 'Company'} sponsorship are approaching expiration:

• Residency Visa: ${showExpiryNoticeModal.visaExpiryDate ? new Date(showExpiryNoticeModal.visaExpiryDate).toLocaleDateString('en-GB') : 'N/A'}
• Emirates ID: ${showExpiryNoticeModal.eidExpiryDate ? new Date(showExpiryNoticeModal.eidExpiryDate).toLocaleDateString('en-GB') : 'N/A'}
• Passport: ${showExpiryNoticeModal.passportExpiryDate ? new Date(showExpiryNoticeModal.passportExpiryDate).toLocaleDateString('en-GB') : 'N/A'}

Kindly submit your updated passport copy, passport size photo with white background, and original Emirates ID to HR immediately to process renewal and avoid MOHRE fines.

Best regards,
HR & Legal Compliance Department
${company?.name || 'Hisaab Pro User Company'} (UAE)`}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`OFFICIAL UAE MOHRE & RESIDENCY RENEWAL NOTICE\n---------------------------------------------\nCompany: ${company?.name || 'Company'}\nTo: ${showExpiryNoticeModal.name} (${showExpiryNoticeModal.employeeId})\nDepartment: ${showExpiryNoticeModal.department || 'Operations'}\n\nDear ${showExpiryNoticeModal.name},\n\nYour UAE Residency Visa / Emirates ID is due for renewal.\nPlease submit updated document copies to HR immediately.\n\nVisa Expiry: ${showExpiryNoticeModal.visaExpiryDate || 'N/A'}\nEmirates ID Expiry: ${showExpiryNoticeModal.eidExpiryDate || 'N/A'}`);
                  setCopiedNotice(true);
                  setTimeout(() => setCopiedNotice(false), 2500);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                {copiedNotice ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedNotice ? 'Notice Copied!' : 'Copy WhatsApp Notice'}</span>
              </button>

              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    const text = encodeURIComponent(`Dear ${showExpiryNoticeModal.name}, your UAE Visa / Emirates ID is approaching expiry date (${showExpiryNoticeModal.visaExpiryDate || 'Soon'}). Please submit your documents to HR for renewal.`);
                    window.open(`https://wa.me/${(showExpiryNoticeModal.phone || '').replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
                <button onClick={() => setShowExpiryNoticeModal(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 transition cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Alerts Header Widget (Feature 2) */}
      {expiringItems.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 no-print">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">EXPIRING SOON SYSTEM ALERTS (60, 30, 15 Days)</h3>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">{expiringItems.length} Urgent Expiries</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {expiringItems.slice(0, 4).map((item, idx) => {
              const info = getAlertStyle(item.daysLeft);
              const targetStaff = activeCompanyStaff.find(s => s.id === item.id);
              return (
                <div key={idx} className={`p-3 rounded-lg border ${info?.border} ${info?.bg} flex items-center justify-between`}>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[120px]">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.type} Expiry</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${info?.badge}`}>
                      {item.daysLeft <= 0 ? 'Expired' : `${item.daysLeft} Days`}
                    </span>
                    {targetStaff && (
                      <button 
                        onClick={() => setShowExpiryNoticeModal(targetStaff)}
                        className="mt-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5 cursor-pointer"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>Notice</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Team View Mode & Celebrations Toolbar */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-3.5 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        {/* View mode switcher tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border dark:border-slate-800 w-full md:w-auto">
          <button 
            onClick={() => setViewMode('split')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'split' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Workspace</span>
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Team Cards ({filteredStaff.length})</span>
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Data Table</span>
          </button>
          <button 
            onClick={() => setViewMode('org')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'org' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Dept Matrix</span>
          </button>
        </div>

        {/* Anniversaries Celebration Toggle */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {upcomingAnniversaries.length > 0 && (
            <button 
              onClick={() => setShowAnniversaries(!showAnniversaries)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${showAnniversaries ? 'bg-amber-500 text-white border-amber-600' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'}`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Work Anniversaries ({upcomingAnniversaries.length})</span>
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            </button>
          )}
        </div>
      </div>

      {/* Work Anniversaries Celebration Banner */}
      {showAnniversaries && upcomingAnniversaries.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-500/20 rounded-xl p-4 no-print space-y-3">
          <div className="flex items-center space-x-2">
            <Cake className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">UPCOMING WORK ANNIVERSARIES THIS MONTH 🎉</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingAnniversaries.map((ann, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-3 rounded-xl flex items-center space-x-3 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center font-bold text-amber-700 dark:text-amber-400 font-mono text-sm border border-amber-200 dark:border-amber-800">
                  {ann.staff.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{ann.staff.name}</p>
                  <p className="text-[10px] text-slate-400">{ann.staff.designation} • {ann.staff.department || 'Operations'}</p>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded mt-1 inline-block">
                    🌟 {ann.years} Year{ann.years > 1 ? 's' : ''} of Service
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 1: TEAM CARDS GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="space-y-4 no-print">
          {/* Quick Filters Header inside Grid View */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg px-3 py-1.5 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, STF ID, department, designation..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-0 outline-hidden text-xs w-full text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-bold uppercase text-[9px]">Department:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
              >
                <option value="All">All Departments ({activeCompanyStaff.length})</option>
                {availableDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStaff.map(s => {
              const grossSalary = (s.basicSalary || 0) + (s.housingAllowance || 0) + (s.transportAllowance || 0) + (s.foodAllowance || 0) + (s.otherAllowance || 0);
              const visaDays = alertDays(s.visaExpiryDate);
              const visaInfo = getAlertStyle(visaDays);

              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group">
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center overflow-hidden border dark:border-slate-800 shadow-xs">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-extrabold text-indigo-700 dark:text-indigo-400 font-mono text-base">{s.name.split(' ').map(n=>n[0]).join('')}</span>
                        )}
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${s.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">{s.employeeId}</span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{s.status}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 line-clamp-1">{s.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{s.designation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Dept */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Building className="w-3 h-3 text-indigo-500" />
                      <span>{s.department || 'Operations'}</span>
                    </span>
                    {s.nationality && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-md">
                        🌐 {s.nationality}
                      </span>
                    )}
                    {s.paymentMethod && (
                      <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md">
                        💳 {s.paymentMethod}
                      </span>
                    )}
                  </div>

                  {/* Document Expiry Health Bar */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border dark:border-slate-800/60 space-y-1.5 text-[10px]">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Visa Expiry Status:</span>
                      <span className={`font-bold px-1.5 py-0.2 rounded ${visaInfo ? visaInfo.badge : 'bg-slate-200 text-slate-700'}`}>
                        {visaDays !== null ? (visaDays < 0 ? 'Expired' : `${visaDays}d left`) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Monthly Compensation:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatAED(grossSalary)}</span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between border-t dark:border-slate-800 pt-3">
                    <button 
                      onClick={() => {
                        setSelectedStaffId(s.id);
                        setViewMode('split');
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>

                    <div className="flex space-x-1">
                      <button 
                        onClick={() => setShowExpiryNoticeModal(s)}
                        title="Generate Renewal Notice"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-amber-600 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleEdit(s, e)}
                        title="Edit Personnel Info"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteStaff(s.id, e)}
                        title="Remove Personnel Record"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: HIGH-DENSITY DATA TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden shadow-xs no-print">
          <div className="p-4 border-b dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg px-3 py-1.5 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search staff table..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-0 outline-hidden text-xs w-full text-slate-800 dark:text-slate-100"
              />
            </div>
            <span className="text-xs text-slate-500 font-mono">Total Staff Records: <strong>{filteredStaff.length}</strong></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b dark:border-slate-800">
                  <th className="p-3">Employee STF</th>
                  <th className="p-3">Personnel Name</th>
                  <th className="p-3">Department & Role</th>
                  <th className="p-3">Joining Date</th>
                  <th className="p-3">Monthly Compensation</th>
                  <th className="p-3">Visa Expiry</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.map(s => {
                  const gross = (s.basicSalary || 0) + (s.housingAllowance || 0) + (s.transportAllowance || 0) + (s.foodAllowance || 0) + (s.otherAllowance || 0);
                  const visaDays = alertDays(s.visaExpiryDate);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition">
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.employeeId}</td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 text-xs font-mono">
                            {s.photoUrl ? <img src={s.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : s.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                            <p className="text-[10px] text-slate-400">{s.phone || s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{s.department || 'Operations'}</p>
                        <p className="text-[10px] text-slate-400">{s.designation}</p>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{s.joiningDate ? new Date(s.joiningDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{formatAED(gross)}</td>
                      <td className="p-3">
                        {s.visaExpiryDate ? (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${visaDays !== null && visaDays < 30 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {new Date(s.visaExpiryDate).toLocaleDateString('en-GB')} ({visaDays}d)
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => {
                              setSelectedStaffId(s.id);
                              setViewMode('split');
                            }}
                            className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold hover:bg-indigo-100 transition cursor-pointer"
                          >
                            Profile
                          </button>
                          <button 
                            onClick={(e) => handleEdit(s, e)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: DEPARTMENT MATRIX & ORGANISATIONAL STRUCTURE */}
      {viewMode === 'org' && (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departmentMatrix.map((dept, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{dept.deptName} Team</h3>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 text-xs font-bold font-mono px-2.5 py-0.5 rounded-full">
                    {dept.headcount} Staff
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Monthly Payroll Outflow:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatAED(dept.totalSalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Average per Member:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{formatAED(dept.totalSalary / dept.headcount)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Team Roster</p>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {dept.members.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => {
                          setSelectedStaffId(m.id);
                          setViewMode('split');
                        }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg cursor-pointer text-xs transition"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                            {m.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{m.name}</p>
                            <p className="text-[9px] text-slate-400">{m.designation}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 font-bold">{m.employeeId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 0: SPLIT WORKSPACE VIEW (Default) */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
          {/* Left Column: Staff Directory */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center space-x-2 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-lg px-2.5 py-1.5">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search staff, design, ID..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-0 outline-hidden text-xs w-full text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Status Filter:</span>
                <div className="flex space-x-1">
                  {(['All', 'Active', 'Inactive', 'Resigned'] as const).map(st => (
                    <button 
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 rounded cursor-pointer ${statusFilter === st ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-slate-800">
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Team / Department</label>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full text-[10px] bg-white dark:bg-slate-950 border dark:border-slate-800 rounded px-1.5 py-1 text-slate-700 dark:text-slate-300 outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="All">All Teams ({activeCompanyStaff.length})</option>
                    {availableDepts.map(d => (
                      <option key={d} value={d}>{d} Team</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Nationality Filter</label>
                  <select
                    value={nationalityFilter}
                    onChange={(e) => setNationalityFilter(e.target.value)}
                    className="w-full text-[10px] bg-white dark:bg-slate-950 border dark:border-slate-800 rounded px-1.5 py-1 text-slate-700 dark:text-slate-300 outline-hidden focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="All">All Nations</option>
                    {availableNationalities.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[550px] overflow-y-auto">
              {filteredStaff.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No staff matches found.</p>
                </div>
              ) : (
                filteredStaff.map(s => {
                  const isActive = s.id === selectedStaffId;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => {
                        setSelectedStaffId(s.id);
                        setIsAddingEdit(false);
                        // Update sub-forms values to match selected staff
                        setLeaveTotalInput(s.leaveBalanceTotal ?? 30);
                        setLeaveUsedInput(s.leaveBalanceUsed ?? 0);
                        setAdvanceAmount(s.advanceSalaryGiven ?? 0);
                        setAdvanceInstallments(s.advanceSalaryInstallments ?? 0);
                        setAdvancePending(s.advanceSalaryPending ?? 0);
                      }}
                      className={`p-4 flex items-center space-x-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition-all ${isActive ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-l-4 border-indigo-600' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex-shrink-0 flex items-center justify-center overflow-hidden border dark:border-slate-800">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-extrabold text-indigo-700 dark:text-indigo-400 font-mono text-sm">{s.name.split(' ').map(n=>n[0]).join('')}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-600 dark:text-slate-300">{s.employeeId}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : s.status === 'Inactive' ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800'}`}>{s.status}</span>
                        </div>
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-1 truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{s.designation} • {s.department || 'Operations'}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex space-x-1">
                          <button onClick={(e) => handleEdit(s, e)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600 cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => handleDeleteStaff(s.id, e)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-rose-600 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        {/* Right Column: Active Workspace (Form vs Profile view) */}
        <div className="lg:col-span-8">
          {isAddingEdit ? (
            /* ONBOARD / EDIT STAFF FORM (Feature 1) */
            <form onSubmit={handleSaveStaff} className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6 space-y-6 shadow-xs">
              <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  <span>{editStaffId ? `Modify Personnel File: ${formData.employeeId}` : 'Onboard New Employee'}</span>
                </h3>
                <button type="button" onClick={() => setIsAddingEdit(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid 1: Personal A-Z */}
              <div className="space-y-4">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider border-b pb-1">Section A: Personal Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Full Employee Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ahmed Al-Mansoori"
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Employee ID (STF)</label>
                    <input 
                      type="text" 
                      disabled
                      value={formData.employeeId} 
                      className="w-full bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-400 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Gender</label>
                    <select 
                      value={formData.gender} 
                      onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Designation *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.designation} 
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Team / Department *</label>
                    <input 
                      type="text" 
                      list="team-department-presets"
                      placeholder="e.g. Sales, Accounts, Operations, IT"
                      value={formData.department} 
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-medium"
                    />
                    <datalist id="team-department-presets">
                      <option value="Sales & Business Development" />
                      <option value="Accounts & Finance" />
                      <option value="Operations & Logistics" />
                      <option value="IT & Software Engineering" />
                      <option value="HR & Administration" />
                      <option value="Customer Success & Support" />
                    </datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Date of Joining *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.joiningDate} 
                      onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.dob} 
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Nationality</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Indian, UAE National"
                      value={formData.nationality} 
                      onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Religion</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Islam, Hinduism"
                      value={formData.religion} 
                      onChange={(e) => setFormData({...formData, religion: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Avatar Photo Link / Upload</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="file" 
                        ref={photoInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button 
                        type="button" 
                        onClick={() => photoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded font-bold cursor-pointer transition flex items-center gap-1"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>
                      {formData.photoUrl && <span className="text-[10px] text-emerald-600 font-bold">✓ Attached</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Contact + Emergency */}
              <div className="space-y-4">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider border-b pb-1">Section B: Contact & Emergency Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Mobile Phone Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="+971 50 123 4567"
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="john.doe@company.ae"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Home Address (UAE)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Al Barsha 2, Villa 15"
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">City / Country</label>
                    <input 
                      type="text" 
                      value={formData.cityCountry} 
                      onChange={(e) => setFormData({...formData, cityCountry: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="bg-rose-500/5 p-4 rounded-lg border border-rose-500/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-rose-700">Emergency Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Spouse or Parent Name"
                      value={formData.emergencyName} 
                      onChange={(e) => setFormData({...formData, emergencyName: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-rose-700">Emergency Phone *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="+971 50 987 6543"
                      value={formData.emergencyPhone} 
                      onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-rose-700">Emergency Relationship *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Spouse, Father"
                      value={formData.emergencyRelationship} 
                      onChange={(e) => setFormData({...formData, emergencyRelationship: e.target.value})}
                      className="w-full bg-white dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 3: Expiry Dates */}
              <div className="space-y-4">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider border-b pb-1">Section C: MOHRE Legal Compliances (Expiry Dates)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Emirates ID Expiry Date *</label>
                    <input 
                      type="date" 
                      value={formData.eidExpiryDate} 
                      onChange={(e) => setFormData({...formData, eidExpiryDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Visa Expiry Date *</label>
                    <input 
                      type="date" 
                      value={formData.visaExpiryDate} 
                      onChange={(e) => setFormData({...formData, visaExpiryDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Passport Expiry Date *</label>
                    <input 
                      type="date" 
                      value={formData.passportExpiryDate} 
                      onChange={(e) => setFormData({...formData, passportExpiryDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 4: Salary & Contracts (Feature 3) */}
              <div className="space-y-4">
                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider border-b pb-1">Section D: UAE Salary Package, Work Shifts & Contract Specifics</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Basic Salary (AED) *</label>
                    <input 
                      type="number" 
                      required
                      value={formData.basicSalary} 
                      onChange={(e) => setFormData({...formData, basicSalary: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Housing Allowance (AED)</label>
                    <input 
                      type="number" 
                      value={formData.housingAllowance} 
                      onChange={(e) => setFormData({...formData, housingAllowance: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Transport Allowance (AED)</label>
                    <input 
                      type="number" 
                      value={formData.transportAllowance} 
                      onChange={(e) => setFormData({...formData, transportAllowance: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-semibold text-indigo-600">Overtime Rate per Hour (AED)</label>
                    <input 
                      type="number" 
                      value={formData.overtimeRate} 
                      onChange={(e) => setFormData({...formData, overtimeRate: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Contract Type *</label>
                    <select 
                      value={formData.contractType} 
                      onChange={(e) => setFormData({...formData, contractType: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Limited">Limited Contract</option>
                      <option value="Unlimited">Unlimited Contract</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-semibold text-indigo-600">Assigned Work Shift *</label>
                    <select 
                      value={formData.workShift || 'Morning'} 
                      onChange={(e) => setFormData({...formData, workShift: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-bold"
                    >
                      <option value="Morning">Day Shift ({company?.dayShiftStart || '08:00'} - {company?.dayShiftEnd || '17:00'})</option>
                      <option value="Night">Night Shift ({company?.nightShiftStart || '20:00'} - {company?.nightShiftEnd || '05:00'})</option>
                      <option value="Evening">Evening Rotational Shift</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Contract Start Date</label>
                    <input 
                      type="date" 
                      value={formData.contractStartDate} 
                      onChange={(e) => setFormData({...formData, contractStartDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Contract End Date</label>
                    <input 
                      type="date" 
                      value={formData.contractEndDate} 
                      onChange={(e) => setFormData({...formData, contractEndDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Shift Schedule Info Card */}
                <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formData.workShift === 'Night' ? '🌙 Night Shift Schedule:' : '☀️ Day Shift Schedule:'}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {formData.workShift === 'Night' 
                        ? `${company?.nightShiftStart || '20:00'} to ${company?.nightShiftEnd || '05:00'}`
                        : `${company?.dayShiftStart || '08:00'} to ${company?.dayShiftEnd || '17:00'}`
                      }
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold rounded">
                    {formData.workShift === 'Night' 
                      ? `Break: ${company?.nightShiftBreakMins || 60} mins`
                      : `Break: ${company?.dayShiftBreakMins || 60} mins`
                    }
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-semibold text-emerald-600">Payment Method *</label>
                    <select 
                      value={formData.paymentMethod} 
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="Bank Transfer">WPS Bank Transfer</option>
                      <option value="Cash">Cash Hold</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Bank Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Emirates NBD"
                      value={formData.bankName} 
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 font-mono">IBAN (UAE Bank)</label>
                    <input 
                      type="text" 
                      placeholder="AE12022000000..."
                      value={formData.iban} 
                      onChange={(e) => setFormData({...formData, iban: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100 dark:bg-slate-950/60 p-3 rounded">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Total Leaves Annual Limit</label>
                    <input 
                      type="number" 
                      value={formData.leaveBalanceTotal} 
                      onChange={(e) => setFormData({...formData, leaveBalanceTotal: Number(e.target.value)})}
                      className="w-full bg-white dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Leaves Used (To Date)</label>
                    <input 
                      type="number" 
                      value={formData.leaveBalanceUsed} 
                      onChange={(e) => setFormData({...formData, leaveBalanceUsed: Number(e.target.value)})}
                      className="w-full bg-white dark:bg-slate-950 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end space-x-2 border-t pt-4 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAddingEdit(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Personnel Profile</span>
                </button>
              </div>
            </form>
          ) : selectedStaff ? (
            /* DETAILED STAFF PROFILE INSPECTOR WORKSPACE */
            <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden shadow-xs">
              
              {/* Profile Card Header */}
              <div className="p-6 bg-slate-50/50 dark:bg-slate-950/20 border-b dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 flex-shrink-0 flex items-center justify-center overflow-hidden border dark:border-slate-800">
                  {selectedStaff.photoUrl ? (
                    <img src={selectedStaff.photoUrl} alt={selectedStaff.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-400 font-mono text-xl">{selectedStaff.name.split(' ').map(n=>n[0]).join('')}</span>
                  )}
                </div>
                <div className="text-center md:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="font-mono text-[9px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-bold">{selectedStaff.employeeId}</span>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold">{selectedStaff.department || 'Operations'} Department</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1.5">{selectedStaff.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{selectedStaff.designation}</span>
                    <span className="mx-1">•</span>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined: {new Date(selectedStaff.joiningDate).toLocaleDateString('en-GB')}</span>
                  </p>
                </div>
                <div className="flex flex-col items-center md:items-end gap-1 font-mono text-right">
                  <p className="text-[9px] uppercase font-bold text-slate-400">Monthly Package</p>
                  <p className="text-lg font-extrabold text-slate-800 dark:text-emerald-400">
                    AED {(selectedStaff.basicSalary + selectedStaff.housingAllowance + selectedStaff.transportAllowance).toLocaleString()}
                  </p>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${selectedStaff.paymentMethod === 'Bank Transfer' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {selectedStaff.paymentMethod === 'Bank Transfer' ? 'UAE WPS REGISTERED' : 'CASH LOG'}
                  </span>
                </div>
              </div>

              {/* Profile Internal Workspace Navigation Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs select-none">
                {[
                  { id: 'info', name: 'Profile Summary', icon: Users },
                  { id: 'salary', name: 'Salary, Contract & Advance', icon: DollarSign },
                  { id: 'increments', name: 'Increments & Promotion Log', icon: Award },
                  { id: 'docs', name: 'Legal Attachments', icon: FileText },
                  { id: 'leaves', name: 'Leave Tracker [Manual]', icon: Calendar },
                  { id: 'payslips', name: 'WPS Payslips Engine', icon: CreditCard },
                  { id: 'letters', name: 'HR Docs Auto-Gen', icon: FileCheck2 },
                  { id: 'attendance', name: 'Attendance Register', icon: Clock },
                  { id: 'eos', name: 'MOHRE EOS Gratuity Calc', icon: Briefcase }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveProfileTab(tab.id as any)}
                      className={`px-4 py-3 border-b-2 font-bold flex items-center space-x-1.5 whitespace-nowrap cursor-pointer transition-all ${
                        activeProfileTab === tab.id 
                          ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="p-6 text-xs text-slate-700 dark:text-slate-300">
                {/* TAB 1: PROFILE SUMMARY */}
                {activeProfileTab === 'info' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] border-b pb-1">Personal Specifics</h4>
                        <div className="grid grid-cols-2 gap-y-2">
                          <p className="text-slate-400">Gender:</p><p className="font-medium">{selectedStaff.gender}</p>
                          <p className="text-slate-400">Nationality:</p><p className="font-medium">{selectedStaff.nationality || '-'}</p>
                          <p className="text-slate-400">Religion:</p><p className="font-medium">{selectedStaff.religion || '-'}</p>
                          <p className="text-slate-400">Date of Birth:</p><p className="font-medium font-mono">{selectedStaff.dob ? new Date(selectedStaff.dob).toLocaleDateString('en-GB') : '-'}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] border-b pb-1">Contact Details</h4>
                        <div className="grid grid-cols-2 gap-y-2">
                          <p className="text-slate-400">Phone Mobile:</p><p className="font-medium font-mono">{selectedStaff.phone}</p>
                          <p className="text-slate-400">Email Address:</p><p className="font-medium truncate">{selectedStaff.email}</p>
                          <p className="text-slate-400">Home Address:</p><p className="font-medium">{selectedStaff.address || '-'}</p>
                          <p className="text-slate-400">City / Country:</p><p className="font-medium">{selectedStaff.cityCountry || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-rose-50/40 dark:bg-rose-950/20 p-4 rounded-lg border border-rose-100 dark:border-rose-950 space-y-3">
                      <h4 className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[9px] border-b pb-1">Emergency Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-slate-400">Contact Person:</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStaff.emergencyName}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Emergency Phone:</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">{selectedStaff.emergencyPhone}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Relationship:</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedStaff.emergencyRelationship}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SALARY, CONTRACT & ADVANCE */}
                {activeProfileTab === 'salary' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Work Contract Summary */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] border-b pb-1">WPS Registered Bank Account & Contract</h4>
                        <div className="grid grid-cols-2 gap-y-2">
                          <p className="text-slate-400">Contract Type:</p><p className="font-bold text-indigo-600">{selectedStaff.contractType || 'Limited'}</p>
                          <p className="text-slate-400">Start Date:</p><p className="font-medium font-mono">{selectedStaff.contractStartDate ? new Date(selectedStaff.contractStartDate).toLocaleDateString('en-GB') : '-'}</p>
                          <p className="text-slate-400">End Date:</p>
                          <div>
                            <p className="font-medium font-mono">{selectedStaff.contractEndDate ? new Date(selectedStaff.contractEndDate).toLocaleDateString('en-GB') : 'N/A'}</p>
                            {selectedStaff.contractEndDate && alertDays(selectedStaff.contractEndDate) !== null && alertDays(selectedStaff.contractEndDate)! <= 30 && (
                              <span className="text-[8px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold mt-1 inline-block">30 Days Warning</span>
                            )}
                          </div>
                          <p className="text-slate-400">Bank Name:</p><p className="font-medium">{selectedStaff.bankName || 'WPS Cash Hold'}</p>
                          <p className="text-slate-400 font-mono">IBAN UAE:</p><p className="font-medium font-mono">{selectedStaff.iban || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Package breakdown */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] border-b pb-1">Allowances & Overtime Rate</h4>
                        <div className="grid grid-cols-2 gap-y-2">
                          <p className="text-slate-400">Basic Salary:</p><p className="font-bold font-mono text-emerald-600">AED {selectedStaff.basicSalary.toLocaleString()}</p>
                          <p className="text-slate-400">Housing Allowance:</p><p className="font-medium font-mono">AED {selectedStaff.housingAllowance.toLocaleString()}</p>
                          <p className="text-slate-400">Transport Allowance:</p><p className="font-medium font-mono">AED {selectedStaff.transportAllowance.toLocaleString()}</p>
                          <p className="text-slate-400">Food Allowance:</p><p className="font-medium font-mono">AED {selectedStaff.foodAllowance.toLocaleString()}</p>
                          <p className="text-slate-400">Overtime hourly rate:</p><p className="font-bold font-mono text-indigo-600">AED {selectedStaff.overtimeRate}/Hour</p>
                        </div>
                      </div>
                    </div>

                    {/* Advance Salary Log */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center border-b pb-1.5">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px]">Salary Advance Ledger Tracking</h4>
                        <span className="text-[9px] text-slate-400 font-mono">Pending Balance: <strong className="text-rose-600">AED {(selectedStaff.advanceSalaryPending ?? 0).toLocaleString()}</strong></span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-850">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Advance Given (AED)</label>
                          <input 
                            type="number" 
                            value={advanceAmount} 
                            onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1 font-mono text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Installments Plan</label>
                          <input 
                            type="number" 
                            value={advanceInstallments} 
                            onChange={(e) => setAdvanceInstallments(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1 font-mono text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Outstanding Balance</label>
                          <input 
                            type="number" 
                            value={advancePending} 
                            onChange={(e) => setAdvancePending(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1 font-mono text-xs mt-1"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={updateAdvanceSalary}
                          className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Update Ledger
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: INCREMENTS & PROMOTION LOG */}
                {activeProfileTab === 'increments' && (
                  <div className="space-y-6 animate-fade-in text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Log promotion form */}
                      <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 rounded-lg border dark:border-slate-800 space-y-4">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] border-b pb-1">Review Salary & Log Promotion</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Effective Date</label>
                            <input 
                              type="date" 
                              value={incDate} 
                              onChange={(e) => setIncDate(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">New Basic Salary (AED / Month)</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1.5 font-bold text-slate-400">AED</span>
                              <input 
                                type="number" 
                                value={incNewSalary || ''} 
                                onChange={(e) => setIncNewSalary(Number(e.target.value))}
                                placeholder={`Current: ${selectedStaff.basicSalary}`}
                                className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded pl-12 pr-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono outline-hidden"
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">Current Base: {formatAED(selectedStaff.basicSalary)}</p>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">New Designation / Job Title (Optional)</label>
                            <input 
                              type="text" 
                              value={incDesignation} 
                              onChange={(e) => setIncDesignation(e.target.value)}
                              placeholder={`Current: ${selectedStaff.designation}`}
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Approved By / Authority</label>
                            <input 
                              type="text" 
                              value={incApprovedBy} 
                              onChange={(e) => setIncApprovedBy(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-hidden"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleSaveIncrement}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Apply Review & Update Master Card</span>
                          </button>
                        </div>
                      </div>

                      {/* Timeline history */}
                      <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-lg space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[9px] border-b pb-1 flex justify-between items-center">
                          <span>Salary Review & Promotion Timeline</span>
                          <span className="font-mono text-slate-400 normal-case">{selectedStaff.name}</span>
                        </h4>

                        {(!selectedStaff.incrementLog || selectedStaff.incrementLog.length === 0) ? (
                          <div className="p-8 text-center border-2 border-dashed dark:border-slate-800 rounded-lg text-slate-400">
                            <Award className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs">No promotions or increments registered yet.</p>
                            <p className="text-[10px] mt-1">Use the form on the left to log historical salary reviews or designation changes.</p>
                          </div>
                        ) : (
                          <div className="relative pl-6 space-y-4 border-l border-slate-200 dark:border-slate-800 ml-3 py-2">
                            {selectedStaff.incrementLog.map((log) => {
                              const diff = log.newSalary - log.oldSalary;
                              const percentage = log.oldSalary > 0 ? ((diff / log.oldSalary) * 100).toFixed(1) : '100';
                              return (
                                <div key={log.id} className="relative">
                                  {/* Point circle */}
                                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white dark:border-[#111827] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>

                                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-800 space-y-1.5">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-extrabold text-slate-800 dark:text-slate-200">
                                          {log.designationChange ? `Promoted to ${log.designationChange}` : 'Annual Salary Review'}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Effective Date: {new Date(log.date).toLocaleDateString('en-GB')}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteIncrementLog(log.id)}
                                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-850 font-mono text-[10px]">
                                      <div>
                                        <p className="text-[9px] text-slate-400 font-sans uppercase">Old Base</p>
                                        <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{formatAED(log.oldSalary)}</p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] text-slate-400 font-sans uppercase">New Base</p>
                                        <p className="font-bold text-emerald-600 mt-0.5">{formatAED(log.newSalary)}</p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] text-slate-400 font-sans uppercase">Increment</p>
                                        <p className="font-black text-indigo-500 mt-0.5">+{percentage}%</p>
                                      </div>
                                    </div>

                                    <div className="text-[10px] text-slate-450 pt-1 flex justify-between items-center">
                                      <span>Authority Approved: <strong>{log.approvedBy}</strong></span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 3: LEGAL ATTACHMENTS */}
                {activeProfileTab === 'docs' && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800">
                      <div className="w-full md:w-1/3 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Document Classification</label>
                        <select 
                          value={selectedDocType} 
                          onChange={(e) => setSelectedDocType(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                        >
                          <option value="Passport">Passport Copy</option>
                          <option value="EmiratesID">Emirates ID (Front/Back)</option>
                          <option value="Visa">Residence Visa Copy</option>
                          <option value="LaborCard">Labor Card</option>
                          <option value="OfferLetter">MOHRE Offer Letter</option>
                          <option value="JoiningLetter">Joining Letter</option>
                          <option value="Contract">Labor Contract</option>
                          <option value="Cancellation">Cancellation Clearance Letter</option>
                        </select>
                      </div>
                      
                      <div className="w-full md:w-2/3 flex items-center space-x-2">
                        <input 
                          type="file" 
                          ref={docInputRef}
                          onChange={handleDocUpload}
                          className="hidden"
                        />
                        <button 
                          type="button" 
                          onClick={() => docInputRef.current?.click()}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs transition-all cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Select Compliance Document to Upload</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs border-b pb-1.5 uppercase tracking-wider">ATTACHED COPIES ({selectedStaff.documents?.length || 0})</h4>
                      {(!selectedStaff.documents || selectedStaff.documents.length === 0) ? (
                        <p className="text-slate-400 italic text-center py-6">No compliance documents attached yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedStaff.documents.map((doc, idx) => {
                            let typeDays = null;
                            if (doc.type === 'Passport') typeDays = alertDays(selectedStaff.passportExpiryDate);
                            if (doc.type === 'EmiratesID') typeDays = alertDays(selectedStaff.eidExpiryDate);
                            if (doc.type === 'Visa') typeDays = alertDays(selectedStaff.visaExpiryDate);
                            const style = getAlertStyle(typeDays);

                            return (
                              <div key={idx} className="p-3 rounded-lg border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <FileText className="w-8 h-8 text-indigo-500 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                                    <p className="text-[10px] text-slate-400">{doc.type} • {doc.fileSize || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  {style && (
                                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full font-mono block ${style.badge}`}>
                                      {style.label}
                                    </span>
                                  )}
                                  {doc.dataUrl ? (
                                    <a href={doc.dataUrl} download={doc.fileName} className="text-[9px] font-bold text-indigo-600 hover:underline mt-1.5 inline-block">Download Copy</a>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 block mt-1.5">No Source Stream</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: LEAVE TRACKER & SPECIFIC DATE LEAVE DEDUCTIONS */}
                {activeProfileTab === 'leaves' && (
                  <div className="space-y-6">
                    {/* Summary Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Total Leaves Annual Limit</p>
                        <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{selectedStaff.leaveBalanceTotal ?? 30}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Leaves Used (To Date)</p>
                        <p className="text-3xl font-extrabold text-rose-600 mt-1">{selectedStaff.leaveBalanceUsed ?? 0}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Remaining Balance</p>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                          {(selectedStaff.leaveBalanceTotal ?? 30) - (selectedStaff.leaveBalanceUsed ?? 0)}
                        </p>
                      </div>
                    </div>

                    {/* 1. SPECIFIC DATE LEAVE ENTRY FORM (For Admin / Computer Operator) */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-4">
                      <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                        <div>
                          <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-xs flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Record Specific Date Leave Entry (Admin / Computer Operator)</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Record employee leave for specific dates. Unpaid leave will automatically deduct from WPS salary slip using company's {company?.salaryCalculationBasis === '31_fixed' ? '31-day' : company?.salaryCalculationBasis === 'actual_month_days' ? 'actual calendar day' : '30-day'} calculation basis.
                          </p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handlePrintBlankLeaveForm(selectedStaff)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold rounded text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Leave Application Form</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800 text-xs">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Leave Type *</label>
                          <select 
                            value={manualLeaveType} 
                            onChange={(e) => setManualLeaveType(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1.5 font-bold text-xs"
                          >
                            <option value="Unpaid">Unpaid Leave (Salary Deducted)</option>
                            <option value="Sick">Sick Leave (Medical Note)</option>
                            <option value="Annual">Annual Paid Leave</option>
                            <option value="Maternity">Maternity Leave</option>
                            <option value="Paternity">Paternity Leave</option>
                            <option value="Other">Special / Other Leave</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Start Date *</label>
                          <input 
                            type="date" 
                            value={manualLeaveStartDate} 
                            onChange={(e) => {
                              setManualLeaveStartDate(e.target.value);
                              if (e.target.value > manualLeaveEndDate) setManualLeaveEndDate(e.target.value);
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1.5 font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">End Date *</label>
                          <input 
                            type="date" 
                            value={manualLeaveEndDate} 
                            onChange={(e) => setManualLeaveEndDate(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1.5 font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Leave Days</label>
                          <input 
                            type="number" 
                            min="1"
                            value={manualLeaveDaysInput} 
                            onChange={(e) => setManualLeaveDaysInput(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1.5 font-mono text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Operator / Reason</label>
                          <input 
                            type="text" 
                            placeholder="Reason / Notes..."
                            value={manualLeaveNotes} 
                            onChange={(e) => setManualLeaveNotes(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1.5 text-xs"
                          />
                        </div>

                        <button 
                          type="button" 
                          onClick={handleAddManualLeaveRecord}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Record Entry</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. RECORDED LEAVE ENTRIES HISTORY TABLE */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-xs">
                        Recorded Specific Date Leave History ({selectedStaff.leaveRecords?.length || 0} Entries)
                      </h4>

                      {(!selectedStaff.leaveRecords || selectedStaff.leaveRecords.length === 0) ? (
                        <div className="p-6 text-center text-slate-400 text-xs border border-dashed rounded-lg bg-white dark:bg-slate-900">
                          No specific date leave entries recorded yet. Use the form above to log leave dates for salary deduction.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-200/60 dark:bg-slate-850 text-slate-600 dark:text-slate-300 uppercase text-[9px] font-bold font-mono">
                                <th className="p-2">Leave Type</th>
                                <th className="p-2">Start Date</th>
                                <th className="p-2">End Date</th>
                                <th className="p-2">Duration</th>
                                <th className="p-2">Salary Impact</th>
                                <th className="p-2">Reason / Operator Notes</th>
                                <th className="p-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                              {selectedStaff.leaveRecords.map((rec, idx) => (
                                <tr key={rec.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-sans">
                                  <td className="p-2 font-bold text-slate-800 dark:text-slate-200">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                      rec.type === 'Unpaid' 
                                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
                                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                    }`}>
                                      {rec.type} Leave
                                    </span>
                                  </td>
                                  <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{rec.startDate}</td>
                                  <td className="p-2 font-mono text-slate-600 dark:text-slate-400">{rec.endDate}</td>
                                  <td className="p-2 font-mono font-bold text-slate-800 dark:text-slate-100">{rec.days} Day(s)</td>
                                  <td className="p-2 font-mono text-[11px]">
                                    {rec.type === 'Unpaid' ? (
                                      <span className="text-rose-600 font-bold">Auto Salary Deducted</span>
                                    ) : (
                                      <span className="text-emerald-600">Paid Leave</span>
                                    )}
                                  </td>
                                  <td className="p-2 text-slate-500 text-[11px]">{rec.notes || 'N/A'}</td>
                                  <td className="p-2 font-mono text-[10px]">
                                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded font-bold">
                                      {rec.status || 'Approved'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 3. ANNUAL LEAVE BALANCE LIMIT OVERRIDE */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                      <h4 className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[9px] border-b pb-1">Annual Leave Ledger Balance Limits (MOHRE compliance)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-white dark:bg-slate-900 p-3 rounded border dark:border-slate-800">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Total Annual Leaves Limit</label>
                          <input 
                            type="number" 
                            value={leaveTotalInput} 
                            onChange={(e) => setLeaveTotalInput(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1 font-mono text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Annual Leaves Used</label>
                          <input 
                            type="number" 
                            value={leaveUsedInput} 
                            onChange={(e) => setLeaveUsedInput(Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded p-1 font-mono text-xs mt-1"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={updateLeaveBalance}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs transition cursor-pointer"
                        >
                          Save Annual Limits
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: WPS PAYSLIPS ENGINE */}
                {activeProfileTab === 'payslips' && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b dark:border-slate-800 pb-1">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px]">Generate Monthly Wage Slip (WPS Copy)</h4>
                        <button 
                          type="button"
                          onClick={handleExportWpsSif}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[10px] uppercase flex items-center gap-1 cursor-pointer transition"
                        >
                          <FileCheck2 className="w-3 h-3" />
                          <span>Export Batch .SIF File</span>
                        </button>
                      </div>
                      
                      {/* Salary Calculation Basis & Auto Leave Deduction Info Banner */}
                      {(() => {
                        const basis = company?.salaryCalculationBasis || '30_fixed';
                        let monthDays = 30;
                        if (basis === '31_fixed') monthDays = 31;
                        else if (basis === 'actual_month_days') {
                          if (payMonth.includes('Feb')) monthDays = 28;
                          else if (['April', 'June', 'Sept', 'Nov'].some(m => payMonth.includes(m))) monthDays = 30;
                          else monthDays = 31;
                        }

                        const gross = selectedStaff.basicSalary + (selectedStaff.housingAllowance || 0) + (selectedStaff.transportAllowance || 0) + (selectedStaff.foodAllowance || 0) + (selectedStaff.otherAllowance || 0);
                        const dailyRate = gross > 0 ? (gross / monthDays) : 0;

                        // Unpaid leaves count
                        const unpaidDays = (selectedStaff.leaveRecords || [])
                          .filter(r => r.type === 'Unpaid')
                          .reduce((sum, r) => sum + (r.days || 1), 0);

                        const suggestedDeduction = unpaidDays * dailyRate;

                        return (
                          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
                            <div className="space-y-0.5">
                              <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 font-sans">
                                <DollarSign className="w-4 h-4 text-amber-600" />
                                <span>Company Payroll Rule: {basis === '31_fixed' ? '31-Day Month Basis' : basis === 'actual_month_days' ? 'Actual Calendar Days' : 'Standard 30-Day Month Basis'}</span>
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                Gross Salary: <span className="font-bold text-slate-800 dark:text-slate-100">AED {gross.toLocaleString()}</span> | Daily Rate: <span className="font-bold text-slate-800 dark:text-slate-100">AED {dailyRate.toFixed(2)} / day</span> ({monthDays} days)
                              </p>
                              {unpaidDays > 0 && (
                                <p className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                                  ⚠️ Unpaid Leave Detected: {unpaidDays} day(s) recorded = AED {suggestedDeduction.toFixed(2)} deduction
                                </p>
                              )}
                            </div>
                            {unpaidDays > 0 && (
                              <button 
                                type="button"
                                onClick={() => setPayDeductions(Math.round(suggestedDeduction * 100) / 100)}
                                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] cursor-pointer transition shrink-0 shadow-xs"
                              >
                                Apply Leave Deduction (AED {suggestedDeduction.toFixed(2)})
                              </button>
                            )}
                          </div>
                        );
                      })()}
                      
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end font-sans">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Select Month</label>
                          <select value={payMonth} onChange={(e)=>setPayMonth(e.target.value)} className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1.5 text-xs mt-1">
                            <option value="August 2026">August 2026</option>
                            <option value="July 2026">July 2026</option>
                            <option value="June 2026">June 2026</option>
                            <option value="May 2026">May 2026</option>
                            <option value="April 2026">April 2026</option>
                            <option value="March 2026">March 2026</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">OT Hours Worked</label>
                          <input 
                            type="number" 
                            value={payOTHours} 
                            onChange={(e)=>setPayOTHours(Number(e.target.value))}
                            className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1 font-mono text-xs mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Deductions (AED)</label>
                          <input 
                            type="number" 
                            value={payDeductions} 
                            onChange={(e)=>setPayDeductions(Number(e.target.value))}
                            className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1 font-mono text-xs mt-1 font-bold text-rose-600"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-slate-400">Prepared By (Staff)</label>
                          <select 
                            value={payPreparedBy} 
                            onChange={(e)=>setPayPreparedBy(e.target.value)} 
                            className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1.5 text-xs mt-1"
                          >
                            <option value="">-- Not Selected --</option>
                            {activeCompanyStaff.map(member => (
                              <option key={member.id} value={`${member.name} (${member.designation})`}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleGeneratePayslipRecord}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer transition-all w-full text-center"
                        >
                          Generate & Save Slip
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Salary Slips History</h4>
                      {(!selectedStaff.salarySlips || selectedStaff.salarySlips.length === 0) ? (
                        <p className="text-slate-400 italic text-center py-4">No payroll slips issued yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedStaff.salarySlips.map((slip, idx) => (
                            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <CreditCard className="w-4 h-4 text-emerald-600" />
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{slip.monthYear}</p>
                                  <p className="text-[10px] text-slate-400">Paid on {new Date(slip.paymentDate).toLocaleDateString('en-GB')}</p>
                                </div>
                              </div>
                              <div className="text-right flex items-center space-x-4">
                                <div>
                                  <p className="font-bold font-mono text-slate-800 dark:text-slate-200">AED {slip.netSalary.toLocaleString()}</p>
                                  <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">WPS Settled</span>
                                </div>
                                <button 
                                  onClick={() => handlePrintPayslip(selectedStaff, slip)}
                                  className="p-1 bg-slate-100 hover:bg-indigo-600 dark:bg-slate-800 text-slate-500 hover:text-white rounded transition"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 6: AUTO DOCUMENT GENERATION */}
                {activeProfileTab === 'letters' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Document template 1: Joining Letter */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                        <div className="flex items-center space-x-2 text-indigo-900 dark:text-indigo-400 font-bold">
                          <FileCheck2 className="w-5 h-5" />
                          <span>1. Joining / Appointment Letter</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Generate a professional, legal, binding Ministry of Labor compliant appointment letter detailing designations, salary packets, and general Dubai rules.</p>
                        
                        <div className="space-y-2 pt-2">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400">Corporate Letter Ref Code</label>
                            <input 
                              type="text" 
                              value={joiningRef} 
                              onChange={(e)=>setJoiningRef(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1 font-mono text-xs mt-0.5"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handlePrintJoiningLetter(selectedStaff)}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition cursor-pointer"
                          >
                            Compile Letter of Appointment
                          </button>
                        </div>
                      </div>

                      {/* Document template 2: Full & Final Settlement */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3">
                        <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-400 font-bold">
                          <FileText className="w-5 h-5" />
                          <span>2. Cancellation & Clearance Clearance</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Calculates official UAE law end of service gratuity dynamically based on joining dates, and outputs the final complete settlement clearance sheets.</p>
                        
                        <div className="space-y-2 pt-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400">Exit Reason</label>
                              <select value={cancellationReason} onChange={(e)=>setCancellationReason(e.target.value)} className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded p-1 text-[11px] mt-0.5">
                                <option value="Resignation">Resignation</option>
                                <option value="Termination">Termination</option>
                                <option value="Contract Completion">Contract Completion</option>
                              </select>
                            </div>
                            <div className="flex items-center mt-4">
                              <input 
                                type="checkbox" 
                                id="calcGrat" 
                                checked={calcGratuity} 
                                onChange={(e)=>setCalcGratuity(e.target.checked)}
                                className="mr-1.5"
                              />
                              <label htmlFor="calcGrat" className="text-[9px] uppercase font-bold text-slate-400">MOHRE Gratuity</label>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handlePrintCancellationLetter(selectedStaff)}
                            className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition cursor-pointer"
                          >
                            Compile Full Final Settlement
                          </button>
                        </div>
                      </div>

                       {/* Document template 3: Service Certificate */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-3 md:col-span-2">
                        <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold">
                          <Award className="w-5 h-5" />
                          <span>3. Service Certificate (Experience Letter)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Auto-builds an elegant corporate Certificate of Service acknowledging the employee's contribution, working tenure, and role in your company with UAE stamp layouts.</p>
                        
                        <button 
                          type="button" 
                          onClick={() => handlePrintServiceCertificate(selectedStaff)}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition cursor-pointer mt-2"
                        >
                          Compile & Generate Service Certificate
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 7: ATTENDANCE REGISTER */}
                {activeProfileTab === 'attendance' && (
                  <div className="space-y-6">
                    {/* Analytics / Stats widgets */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-800 text-center">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Attendance Rate</p>
                        <p className={`text-base font-extrabold mt-1 ${attendanceStats.rate >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {attendanceStats.rate}%
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${attendanceStats.rate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            style={{ width: `${attendanceStats.rate}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border dark:border-slate-800 text-center">
                        <p className="text-[9px] uppercase font-bold text-slate-400">Total Logged</p>
                        <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">{attendanceStats.total} Days</p>
                        <p className="text-[9px] text-slate-400 mt-1.5">Registered days</p>
                      </div>

                      <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-950 text-center">
                        <p className="text-[9px] uppercase font-bold text-emerald-600">Present / On Duty</p>
                        <p className="text-base font-extrabold text-emerald-600 mt-1">{attendanceStats.present} Days</p>
                        <p className="text-[9px] text-slate-400 mt-1.5">Regular shift work</p>
                      </div>

                      <div className="bg-amber-50/50 dark:bg-amber-950/10 p-3 rounded-lg border border-amber-100 dark:border-amber-950 text-center">
                        <p className="text-[9px] uppercase font-bold text-amber-600">Late / Delayed</p>
                        <p className="text-base font-extrabold text-amber-600 mt-1">{attendanceStats.late} Days</p>
                        <p className="text-[9px] text-slate-400 mt-1.5">Late logs with remarks</p>
                      </div>

                      <div className="bg-rose-50/50 dark:bg-rose-950/10 p-3 rounded-lg border border-rose-100 dark:border-rose-950 text-center">
                        <p className="text-[9px] uppercase font-bold text-rose-600">Absent / Off Duty</p>
                        <p className="text-base font-extrabold text-rose-600 mt-1">{attendanceStats.absent + attendanceStats.sick} Days</p>
                        <p className="text-[9px] text-slate-400 mt-1.5">{attendanceStats.sick} Sick leaves logged</p>
                      </div>
                    </div>

                    {/* Interactive Logger form & Log History side-by-side */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Attendance Logger Form */}
                      <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-800 space-y-4">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-[9px] border-b pb-1">Register Daily Attendance</h4>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Date</label>
                            <input 
                              type="date" 
                              value={attDate} 
                              onChange={(e) => setAttDate(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Status</label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['Present', 'Absent', 'Sick Leave', 'Late'] as const).map(status => {
                                const active = attStatus === status;
                                return (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => setAttStatus(status)}
                                    className={`px-3 py-2 text-xs font-bold rounded border text-center transition cursor-pointer ${
                                      active 
                                        ? status === 'Present' ? 'bg-emerald-600 border-emerald-600 text-white font-extrabold shadow-sm'
                                          : status === 'Absent' ? 'bg-rose-600 border-rose-600 text-white font-extrabold shadow-sm'
                                          : status === 'Sick Leave' ? 'bg-amber-600 border-amber-600 text-white font-extrabold shadow-sm'
                                          : 'bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Remarks & Details</label>
                            <textarea
                              value={attRemarks}
                              onChange={(e) => setAttRemarks(e.target.value)}
                              placeholder="e.g. Metro delayed, Medical certificate attached, etc."
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-hidden h-20 resize-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveAttendance(selectedStaff.id)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Save Attendance Record</span>
                          </button>
                        </div>
                      </div>

                      {/* Log History */}
                      <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-lg space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[9px] border-b pb-1 flex justify-between items-center">
                          <span>Attendance History Logs</span>
                          <span className="font-mono text-slate-400 normal-case">{selectedStaff.name}</span>
                        </h4>

                        {(!selectedStaff.attendanceLog || selectedStaff.attendanceLog.length === 0) ? (
                          <div className="p-8 text-center border-2 border-dashed dark:border-slate-800 rounded-lg text-slate-400">
                            <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs">No attendance logged for this staff member yet.</p>
                            <p className="text-[10px] mt-1">Use the form on the left to register their daily activity.</p>
                          </div>
                        ) : (
                          <div className="border dark:border-slate-800 rounded-lg overflow-hidden max-h-[340px] overflow-y-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase text-[9px] font-bold">
                                <tr>
                                  <th className="p-2.5">Date</th>
                                  <th className="p-2.5">Status</th>
                                  <th className="p-2.5">Remarks</th>
                                  <th className="p-2.5 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {selectedStaff.attendanceLog.map((log) => (
                                  <tr key={log.date} className="hover:bg-slate-50 dark:hover:bg-slate-950/40">
                                    <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">
                                      {new Date(log.date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="p-2.5">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                        log.status === 'Present' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400'
                                          : log.status === 'Absent' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400'
                                          : log.status === 'Sick Leave' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400'
                                          : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400'
                                      }`}>
                                        {log.status}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-slate-500 max-w-[150px] truncate" title={log.remarks}>
                                      {log.remarks || '-'}
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <button
                                        onClick={() => handleDeleteAttendance(selectedStaff.id, log.date)}
                                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB: EOS GRATUITY CALCULATOR */}
                {activeProfileTab === 'eos' && (
                  <div className="space-y-6 animate-fade-in text-xs font-sans">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-rose-500" />
                        <span>MOHRE UAE End-of-Service Gratuity & Settlement</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-mono mt-0.5">Calculated in compliance with the New UAE Labour Law (Federal Decree-Law No. 33 of 2021)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Left: Input Variables */}
                      <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 rounded-lg border dark:border-slate-800 space-y-4">
                        <h5 className="font-bold text-rose-600 dark:text-rose-400 uppercase text-[9px] border-b pb-1">Separation Parameters</h5>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Separation Reason</label>
                            <select 
                              value={cancellationReason} 
                              onChange={(e) => setCancellationReason(e.target.value)} 
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                            >
                              <option value="Resignation">Resignation by Employee</option>
                              <option value="Termination">Termination by Employer (Fair)</option>
                              <option value="Contract Completion">Fixed Contract Expiry</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Expected Exit Date</label>
                            <input 
                              type="date" 
                              value={eosExitDate} 
                              onChange={(e) => setEosExitDate(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Unpaid Leave Deductions (Days)</label>
                            <input 
                              type="number" 
                              value={unpaidLeaveDays || ''} 
                              onChange={(e) => setUnpaidLeaveDays(Math.max(0, Number(e.target.value)))}
                              placeholder="0 days"
                              className="w-full bg-white dark:bg-slate-900 border dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono outline-hidden"
                            />
                            <p className="text-[9px] text-slate-400 mt-1">Unpaid leaves are deducted from the continuous service duration under MOHRE rules.</p>
                          </div>

                          <div className="pt-2 border-t border-slate-150 dark:border-slate-800/60 font-sans text-[11px] text-slate-500 leading-relaxed space-y-1.5">
                            <p className="font-extrabold text-[9px] text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">[MOHRE COMPLIANCE RULEBOOK]</p>
                            <p>• <strong>Continuous Service &lt; 1 Year:</strong> No gratuity entitlement under any separation circumstances.</p>
                            <p>• <strong>Continuous Service 1 to 5 Years:</strong> Eligible for <strong>21 days</strong> of basic salary for each year of service.</p>
                            <p>• <strong>Continuous Service &gt; 5 Years:</strong> Eligible for <strong>30 days</strong> of basic salary for each year of service exceeding 5 years (plus 21 days/yr for the first 5 years).</p>
                            <p>• <strong>Resignation rules:</strong> Under the 2021 UAE Labour Law, gratuity calculations are unified for resignation and termination.</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Real-time Calculation Sheet */}
                      {(() => {
                        const start = new Date(selectedStaff.joiningDate);
                        const end = new Date(eosExitDate);
                        let totalDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                        
                        // Deduct unpaid leaves
                        const netDays = Math.max(0, totalDays - unpaidLeaveDays);
                        const years = Number((netDays / 365.25).toFixed(4));
                        
                        const isEligible = years >= 1.0;
                        const dailyRate = selectedStaff.basicSalary / 30;
                        
                        let earnedDays = 0;
                        let rawGratuity = 0;
                        
                        if (isEligible) {
                          if (years <= 5) {
                            earnedDays = years * 21;
                          } else {
                            earnedDays = (5 * 21) + ((years - 5) * 30);
                          }
                          rawGratuity = earnedDays * dailyRate;
                        }

                        // Cap at 2 years full salary (24 * total salary)
                        const totalMonthlyAllowance = selectedStaff.housingAllowance + selectedStaff.transportAllowance + selectedStaff.foodAllowance + selectedStaff.otherAllowance;
                        const grossMonthly = selectedStaff.basicSalary + totalMonthlyAllowance;
                        const maxCap = grossMonthly * 24;
                        const actualGratuity = Math.min(rawGratuity, maxCap);
                        
                        const pendingDeductions = selectedStaff.advanceSalaryPending || 0;
                        const finalBaseDue = selectedStaff.basicSalary + totalMonthlyAllowance; // Final month salary dues
                        const netSettlement = actualGratuity + finalBaseDue - pendingDeductions;

                        return (
                          <div className="md:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 font-sans">
                            <h5 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[9px] border-b pb-1.5 flex justify-between items-center">
                              <span>Settlement Projection sheet</span>
                              <span className="font-mono text-indigo-500 uppercase tracking-widest text-[8px] font-black">[BILINGUAL GCC LAYOUT]</span>
                            </h5>

                            <div className="grid grid-cols-2 gap-4 font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-850">
                              <div>
                                <p className="text-slate-400 font-sans uppercase text-[8px] tracking-wider">Date of Joining</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{new Date(selectedStaff.joiningDate).toLocaleDateString('en-GB')}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-sans uppercase text-[8px] tracking-wider">Date of Exit</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{new Date(eosExitDate).toLocaleDateString('en-GB')}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-sans uppercase text-[8px] tracking-wider">Gross Service</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{totalDays} Calendar Days</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-sans uppercase text-[8px] tracking-wider">Net Eligible Service</p>
                                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{netDays} Days ({years.toFixed(2)} Years)</p>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2 text-xs">
                              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 font-sans">MOHRE Gratuity Eligibility Status:</span>
                                <span className={`font-bold font-mono ${isEligible ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {isEligible ? 'ELIGIBLE' : 'INSUFFICIENT TENURE (< 1 Year)'}
                                </span>
                              </div>

                              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 font-sans">Basic Salary Rate (for Gratuity Base):</span>
                                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatAED(selectedStaff.basicSalary)}</span>
                              </div>

                              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 font-sans">Total Accrued Gratuity Days:</span>
                                <span className="font-bold font-mono text-indigo-500">{earnedDays.toFixed(2)} Days Earned</span>
                              </div>

                              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 font-sans">Accrued Gratuity Amount:</span>
                                <span className="font-bold font-mono text-emerald-600">{formatAED(actualGratuity)}</span>
                              </div>

                              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 font-sans">Final Month Salary & Allowances Due:</span>
                                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatAED(finalBaseDue)}</span>
                              </div>

                              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-rose-600 dark:text-rose-400">
                                <span className="font-sans font-bold">Less: Advance Salary Ledger Balance:</span>
                                <span className="font-bold font-mono">-{formatAED(pendingDeductions)}</span>
                              </div>

                              <div className="flex justify-between items-center py-3 px-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl mt-4">
                                <div>
                                  <span className="block text-[9px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-bold">Net Settlement Due</span>
                                  <span className="block text-[8px] text-slate-400">Approved for electronic dispatch</span>
                                </div>
                                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{formatAED(netSettlement)}</span>
                              </div>
                            </div>

                            <button 
                              type="button"
                              onClick={() => {
                                handlePrintCancellationLetter(selectedStaff);
                                alert("Success: Fully cleared Full & Final Settlement document generated! You can preview and print it under the 'HR Docs Auto-Gen' sub-tab.");
                              }}
                              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 mt-4"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Dispatch & Print Full Final clearance sheet</span>
                            </button>
                          </div>
                        );
                      })()}

                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-900/40 p-12 text-center rounded-xl border-2 border-dashed dark:border-slate-800">
              <Users className="w-12 h-12 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-slate-800 dark:text-slate-200">No Employee Selected</p>
              <p className="text-xs text-slate-400 mt-1">Please select an employee profile from the left sidebar directory to review personal detail files, legal attachments, leaves balance logs, WPS salary slips history, or auto-generate HR contracts.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ----------------- MOHRE WPS .SIF FILE GENERATOR MODAL ----------------- */}
      {isSifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900/90 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-emerald-800/40">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-400">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base tracking-tight text-white">
                      UAE MOHRE Salary Information File (.SIF) Generator
                    </h3>
                    <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase">
                      CBUAE WPS Compliant
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Official UAE Ministry of Human Resources &amp; Emiratisation direct salary disbursement file for bank portals (ENBD, FAB, Mashreq, RAKBANK).
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSifModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* 1. Configuration Panel */}
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Employer &amp; Bank Routing Parameters
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Header (SCR) &amp; Employee (EDR) Config</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payroll Period (Month &amp; Year)</label>
                    <input 
                      type="month" 
                      value={sifMonthYear}
                      onChange={(e) => setSifMonthYear(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employer MOHRE ID (13 Digits)</label>
                    <input 
                      type="text" 
                      value={sifEmployerId}
                      onChange={(e) => setSifEmployerId(e.target.value)}
                      placeholder="e.g. 1234567890123"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employer Bank CBUAE Routing Code</label>
                    <input 
                      type="text" 
                      value={sifRoutingCode}
                      onChange={(e) => setSifRoutingCode(e.target.value)}
                      placeholder="e.g. 033999999"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Disbursement Scope Filter</label>
                    <select 
                      value={sifFilterPayment}
                      onChange={(e) => setSifFilterPayment(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="bank_only">WPS Bank Transfer Staff Only</option>
                      <option value="all">Include All Active Staff</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Key Metrics Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3">
                  <span className="block text-[9px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Staff Count</span>
                  <span className="text-xl font-black text-emerald-950 dark:text-emerald-100">{sifData.records.length} Employees</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="block text-[9px] uppercase font-bold text-slate-500">Total Fixed Basic</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatAED(sifData.totalBasic)}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="block text-[9px] uppercase font-bold text-slate-500">Total Allowances</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatAED(sifData.totalAllowances)}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                  <span className="block text-[9px] uppercase font-bold text-slate-500">Loan Deductions</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400">-{formatAED(sifData.totalDeductions)}</span>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-3">
                  <span className="block text-[9px] uppercase font-bold text-indigo-800 dark:text-indigo-300">Net SIF Disbursement</span>
                  <span className="text-base font-black text-indigo-950 dark:text-indigo-100">{formatAED(sifData.totalNet)}</span>
                </div>
              </div>

              {/* 3. Employee Disbursement Lines Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-850 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    EDR Line-Items Preview ({sifData.records.length} Records)
                  </span>
                  <span className="text-slate-400 font-sans font-normal text-[11px]">
                    Pay Period: {sifData.startDate} to {sifData.endDate} (30 Days)
                  </span>
                </div>

                {sifData.records.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 opacity-80" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No employees match "WPS Bank Transfer Only" filter.</p>
                    <button 
                      type="button"
                      onClick={() => setSifFilterPayment('all')} 
                      className="text-xs text-indigo-600 dark:text-indigo-400 underline font-semibold cursor-pointer"
                    >
                      Switch filter to "Include All Active Staff"
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase text-[10px] font-mono border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2">Labour Card / EID</th>
                          <th className="px-3 py-2">Employee Name</th>
                          <th className="px-3 py-2">Bank &amp; IBAN</th>
                          <th className="px-3 py-2 text-right">Basic (AED)</th>
                          <th className="px-3 py-2 text-right">Allowances</th>
                          <th className="px-3 py-2 text-right">Deduction</th>
                          <th className="px-3 py-2 text-right">Net Payable</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                        {sifData.records.map((r, i) => (
                          <tr key={r.staff.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-850/60">
                            <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300">{r.cardNo}</td>
                            <td className="px-3 py-2 font-sans font-bold text-slate-900 dark:text-slate-100">
                              {r.staff.name}
                              <span className="block text-[9px] font-normal text-slate-400">{r.staff.designation}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                              <span className="font-bold block text-slate-800 dark:text-slate-200">{r.staff.bankName || 'UAE Commercial Bank'}</span>
                              <span className="text-[10px] text-slate-400">{r.empIban}</span>
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">{r.basic.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{r.allowances.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-rose-500 font-semibold">-{r.deductions.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-black text-slate-900 dark:text-slate-100">{r.netPay.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 4. Raw SIF Content Accordion / Preview Box */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button 
                  type="button"
                  onClick={() => setShowSifPreview(!showSifPreview)}
                  className="w-full bg-slate-900 text-slate-200 px-4 py-2 text-xs font-mono font-bold flex items-center justify-between cursor-pointer hover:bg-slate-850"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Raw .SIF File Syntax Stream Preview
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {showSifPreview ? 'Hide Raw Stream [-]' : 'Show Raw Stream [+]'}
                  </span>
                </button>

                {showSifPreview && (
                  <div className="bg-slate-950 p-4 font-mono text-[11px] text-emerald-400 space-y-1.5 overflow-x-auto max-h-40 border-t border-slate-800 selection:bg-emerald-800 selection:text-white">
                    <div className="text-slate-500 text-[10px] border-b border-slate-800 pb-1 mb-2 font-sans">
                      // Header Record (SCR) &amp; Employee Detail Records (EDR) formatted with standard CRLF delimiting
                    </div>
                    <pre className="whitespace-pre tracking-wide leading-relaxed">
                      {sifData.fullSifContent}
                    </pre>
                  </div>
                )}
              </div>

              {/* Informational Guidance Note */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>UAE Central Bank &amp; MOHRE WPS Compliance Note:</strong> Direct bank submission files require an official 13-digit Employer ID and valid 23-character UAE IBAN numbers. Ensure all employee bank accounts are registered under their Labour Card ID to avoid WPS gateway settlement rejections.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button 
                type="button"
                onClick={handleCopySifText}
                className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                {sifCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{sifCopied ? 'Copied SIF Syntax!' : 'Copy SIF Raw Text'}</span>
              </button>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button 
                  type="button"
                  onClick={() => setIsSifModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>

                <button 
                  type="button"
                  onClick={handleDownloadSifFile}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official .SIF File</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
